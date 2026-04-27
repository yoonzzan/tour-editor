
import { QuoteMeta } from '@/types';


export const getImageDimensions = (url: string): Promise<{ width: number; height: number }> => {
    return new Promise((resolve) => {
        if (typeof window === 'undefined') return resolve({ width: 0, height: 0 });
        const img = new Image();
        img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
        img.onerror = () => resolve({ width: 0, height: 0 });
        img.src = url;
    });
};

// Helper to load image
export async function fetchImage(url: string): Promise<ArrayBuffer> {
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch image');
    return await response.arrayBuffer();
}

// Helper to fetch and crop whitespace from image (Client-side)
export async function fetchCroppedImage(url: string): Promise<{ buffer: ArrayBuffer; width: number; height: number }> {
    if (typeof window === 'undefined') {
        const buffer = await fetchImage(url);
        return { buffer, width: 0, height: 0 };
    }

    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'Anonymous';
        img.src = url;
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const w = img.naturalWidth;
            const h = img.naturalHeight;
            canvas.width = w;
            canvas.height = h;
            const ctx = canvas.getContext('2d');
            if (!ctx) return reject('Canvas error');

            ctx.drawImage(img, 0, 0);
            const pixels = ctx.getImageData(0, 0, w, h).data;

            // Scan bounds
            let minX = w, minY = h, maxX = 0, maxY = 0;

            for (let y = 0; y < h; y++) {
                for (let x = 0; x < w; x++) {
                    const i = (y * w + x) * 4;
                    const r = pixels[i];
                    const g = pixels[i + 1];
                    const b = pixels[i + 2];
                    const a = pixels[i + 3];

                    // Detect content: Alpha > 0 AND Not White (allowing slight noise)
                    if (a > 10 && (r < 250 || g < 250 || b < 250)) {
                        if (x < minX) minX = x;
                        if (x > maxX) maxX = x;
                        if (y < minY) minY = y;
                        if (y > maxY) maxY = y;
                    }
                }
            }

            // If empty (full white), fallback to original
            if (minX > maxX) { minX = 0; maxX = w; minY = 0; maxY = h; }

            const cropW = maxX - minX + 1;
            const cropH = maxY - minY + 1;

            // Crop to new canvas
            const cut = document.createElement('canvas');
            cut.width = cropW;
            cut.height = cropH;
            const cutCtx = cut.getContext('2d');
            cutCtx?.drawImage(canvas, minX, minY, cropW, cropH, 0, 0, cropW, cropH);

            cut.toBlob(blob => {
                if (blob) {
                    blob.arrayBuffer().then(b => resolve({ buffer: b, width: cropW, height: cropH }));
                } else reject('Blob error');
            }, 'image/png');
        };
        img.onerror = (e) => reject(e);
    });
}

/**
 * 웹 출력과 동일한 인감 도장 placeholder 이미지 생성 (원형 + "(인)").
 * 브라우저에서만 동작하며, Canvas로 그린 후 PNG 버퍼로 반환.
 */
export async function createStampPlaceholderImage(): Promise<{ buffer: ArrayBuffer; width: number; height: number }> {
    if (typeof window === 'undefined') {
        return { buffer: new ArrayBuffer(0), width: 0, height: 0 };
    }

    const size = 80;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return { buffer: new ArrayBuffer(0), width: 0, height: 0 };

    const cx = size / 2;
    const cy = size / 2;
    const radius = (size / 2) - 4;

    // 배경 투명
    ctx.clearRect(0, 0, size, size);

    // 원 테두리 (웹과 동일: 빨간색 테두리)
    ctx.strokeStyle = '#fca5a5';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.stroke();

    // "(인)" 텍스트 (웹과 동일: 빨간색)
    ctx.fillStyle = '#fca5a5';
    ctx.font = 'bold 24px "Malgun Gothic", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('(인)', cx, cy);

    return new Promise((resolve) => {
        canvas.toBlob(
            (blob) => {
                if (blob) {
                    blob.arrayBuffer().then((buffer) =>
                        resolve({ buffer, width: size, height: size })
                    );
                } else {
                    resolve({ buffer: new ArrayBuffer(0), width: 0, height: 0 });
                }
            },
            'image/png'
        );
    });
}

// Helper to generate standardized filename
export const generateSafeFilename = (prefix: string, title?: string) => {
    const safeTitle = (title || '여행견적').trim().replace(/\s+/g, '_').replace(/[^a-zA-Z0-9가-힣_]/g, '');
    const dateStr = new Date().toISOString().slice(0, 10);
    return `${prefix}_${safeTitle}_${dateStr}.xlsx`;
};
