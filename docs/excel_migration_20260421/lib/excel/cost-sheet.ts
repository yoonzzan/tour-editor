
import ExcelJS from 'exceljs';
import { QuoteItem, QuoteMeta } from '@/types';
import { groupItemsByCategory } from '@/lib/export-utils';
import { saveAs } from 'file-saver';
import { fetchCroppedImage, generateSafeFilename, createStampPlaceholderImage } from './common';

/**
 * Generates and downloads the Cost Sheet (견적산출내역서)
 */
export async function downloadCostSheetExcel(items: QuoteItem[], partnerName: string = '하나투어', city: string = '', meta?: QuoteMeta, quoteTitle?: string) {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('견적산출내역서');

    // --- 1. Setup Columns (8 Cols) ---
    // A: 항목 | B: 도시명 | C: 날짜 | D: 상세내역 | E: 인원/개수 | F: 원화 | G: 합계 | H: 건별합계
    sheet.columns = [
        { key: 'category', width: 12 },    // A: 항 목
        { key: 'city', width: 12 },        // B: 도시명
        { key: 'date', width: 12 },        // C: 날짜
        { key: 'name', width: 35 },        // D: 상세내역
        { key: 'qty', width: 10 },         // E: 인원/개수
        { key: 'price', width: 15 },       // F: 원화
        { key: 'total', width: 15 },       // G: 합계
        { key: 'groupTotal', width: 15 },  // H: 건별합계
    ];

    // --- Header Layout ---
    // Set explicit row heights for Logo/Title area to match screenshot
    sheet.getRow(1).height = 35;
    sheet.getRow(2).height = 35;

    // Merge Cells for Layout
    sheet.mergeCells('A1:B2'); // Logo Area
    sheet.mergeCells('D1:F2'); // Title Area
    sheet.mergeCells('G1:H2'); // Date Area

    // --- Add Logo ---
    try {
        const logoUrl = '/images/hanatour_logo.png';
        const { buffer: logoBuffer, width: imgW, height: imgH } = await fetchCroppedImage(logoUrl);
        const logoId = workbook.addImage({ buffer: logoBuffer, extension: 'png' });

        // Option 3: Cropped + Floating Image Strategy
        // Adjusted: Reduced width to 160px for better balance with title
        let w = 160;
        let h = 40;

        if (imgW > 0 && imgH > 0) {
            const ratio = imgW / imgH;
            w = 160;
            h = w / ratio;
        }

        sheet.addImage(logoId, {
            tl: { col: 0.1, row: 0.15 },
            ext: { width: w, height: h },
            editAs: 'oneCell'
        });
    } catch (e) {
        console.warn('Logo load failed', e);
    }

    // --- Title ---
    const titleCell = sheet.getCell('D1');
    titleCell.value = '견적 산출 내역서';
    titleCell.font = { size: 20, bold: true };
    titleCell.alignment = { vertical: 'middle', horizontal: 'center' };

    // --- Meta (Date) ---
    const metaCell = sheet.getCell('G1');
    metaCell.value = {
        richText: [
            { text: `견적 작성일: ${new Date().toLocaleDateString()}`, font: { size: 10 } }
        ]
    };
    metaCell.alignment = { vertical: 'middle', horizontal: 'right' };

    // Spacer Rows - Only use Row 3 as spacer (Remove Row 4 concept)
    sheet.getRow(3).height = 15;

    // Helper to draw thick outer border (Cols 1-8 for Cost Sheet)
    const drawOuterBorder = (startR: number, endR: number) => {
        const mediumStyle = 'medium';
        // Top
        for (let c = 1; c <= 8; c++) {
            const cell = sheet.getCell(startR, c);
            cell.border = { ...cell.border, top: { style: mediumStyle, color: { argb: 'FF000000' } } };
        }
        // Bottom
        for (let c = 1; c <= 8; c++) {
            const cell = sheet.getCell(endR, c);
            cell.border = { ...cell.border, bottom: { style: mediumStyle, color: { argb: 'FF000000' } } };
        }
        // Left (Col 1)
        for (let r = startR; r <= endR; r++) {
            const cell = sheet.getCell(r, 1);
            cell.border = { ...cell.border, left: { style: mediumStyle, color: { argb: 'FF000000' } } };
        }
        // Right (Col 8)
        for (let r = startR; r <= endR; r++) {
            const cell = sheet.getCell(r, 8);
            cell.border = { ...cell.border, right: { style: mediumStyle, color: { argb: 'FF000000' } } };
        }
    };

    // --- 4. Table Header (Shifted to Row 4) ---
    const headerRow = sheet.getRow(4);
    headerRow.values = ['항 목', '지역', '날짜', '상세내역', '인원 / 개수', '원화', '합계', '건별합계'];

    // Apply Header Styles ONLY to columns 1-8
    for (let c = 1; c <= 8; c++) {
        const cell = sheet.getCell(4, c);
        cell.font = { bold: true, size: 10, color: { argb: 'FFFFFFFF' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF5E27A5' } };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
    }

    // --- 5. Data Rows (Start at Row 5) ---
    const groups = groupItemsByCategory(items);
    let currentRowIdx = 5;
    let grandTotal = 0;

    groups.forEach(group => {
        const startRow = currentRowIdx;
        const groupRowCount = group.items.length;

        group.items.forEach((item, idx) => {
            const row = sheet.getRow(currentRowIdx);
            row.font = { size: 9, name: 'Malgun Gothic' }; // Default font for row

            if (idx === 0) {
                row.getCell('category').value = group.category;
                row.getCell('groupTotal').value = group.subtotal;
            }

            row.getCell('city').value = item.location;
            row.getCell('date').value = item.date;

            // Rich Text for Name/Detail differentiation
            const richText: any[] = [{ text: item.name, font: { bold: true, size: 10, name: 'Malgun Gothic' } }];
            if (item.detail) {
                richText.push({ text: `\n${item.detail}`, font: { size: 9, color: { argb: 'FF555555' }, name: 'Malgun Gothic' } });
            }
            row.getCell('name').value = { richText };

            const unitPrice = Math.round((item.totalPriceKrw || 0) / (item.qtyAdult || 1));
            row.getCell('price').value = unitPrice;
            row.getCell('qty').value = item.qtyAdult || 1;
            row.getCell('total').value = item.totalPriceKrw || 0;

            // Formatting
            // Name/Detail: Vertical Middle, Horizontal Left (for readability of long text)
            row.getCell('name').alignment = { wrapText: true, vertical: 'middle', horizontal: 'left' };

            // Explicitly Center & Middle align other columns as requested
            row.getCell('city').alignment = { vertical: 'middle', horizontal: 'center' };
            row.getCell('date').alignment = { vertical: 'middle', horizontal: 'center' };
            row.getCell('qty').alignment = { vertical: 'middle', horizontal: 'center' };

            // Numbers: Request was to Center align them (though usually Right is standard, following user request)
            row.getCell('price').alignment = { vertical: 'middle', horizontal: 'center' };
            row.getCell('total').alignment = { vertical: 'middle', horizontal: 'center' };

            row.getCell('category').alignment = { vertical: 'middle', horizontal: 'center' };
            row.getCell('category').font = { bold: true, size: 10, name: 'Malgun Gothic' };

            row.getCell('groupTotal').alignment = { vertical: 'middle', horizontal: 'right' }; // Group Total usually stays Right/Middle or Center if requested. Keeping Right for sum unless asked.
            row.getCell('groupTotal').font = { bold: true, size: 10, color: { argb: 'FF0000FF' }, name: 'Malgun Gothic' };

            row.getCell('price').numFmt = '#,##0';
            row.getCell('total').numFmt = '#,##0';
            row.getCell('groupTotal').numFmt = '#,##0';

            // Borders
            row.eachCell((cell) => {
                cell.border = {
                    top: { style: 'thin', color: { argb: 'FFCCCCCC' } },
                    left: { style: 'thin', color: { argb: 'FFCCCCCC' } },
                    bottom: { style: 'thin', color: { argb: 'FFCCCCCC' } },
                    right: { style: 'thin', color: { argb: 'FFCCCCCC' } }
                };
            });

            currentRowIdx++;
        });

        // Merge Category Column (A) & Group Total (H)
        if (groupRowCount > 0) {
            sheet.mergeCells(`A${startRow}:A${currentRowIdx - 1}`);
            sheet.mergeCells(`H${startRow}:H${currentRowIdx - 1}`);
        }

        grandTotal += group.subtotal;
    });

    // Draw Outer Border for Main Table
    drawOuterBorder(4, currentRowIdx - 1);

    // Determine Fee and VAT
    const fee = meta?.commission ? parseInt(String(meta.commission).replace(/,/g, '') || '0') : 0;
    const vat = meta?.vat ? parseInt(String(meta.vat).replace(/,/g, '') || '0') : 0;
    const finalTotal = grandTotal + fee + vat;

    // --- 6. Grand Total Section (4 Rows) ---
    currentRowIdx++; // spacer
    const summaryStartRow = currentRowIdx;

    // Helper to create summary row: [Label(Merged B~F)] [Value(Merged G~H)]
    const addSummaryRow = (label: string, value: number, isTotal: boolean = false) => {
        const row = sheet.getRow(currentRowIdx);

        // Label in B (Merged B-F)
        sheet.mergeCells(`B${currentRowIdx}:F${currentRowIdx}`);
        const labelCell = row.getCell('city'); // B column alias
        labelCell.value = label;
        labelCell.alignment = { horizontal: 'center', vertical: 'middle' };
        labelCell.font = { bold: isTotal };

        // Value in G (Merged G-H)
        sheet.mergeCells(`G${currentRowIdx}:H${currentRowIdx}`);
        const valCell = row.getCell('total'); // G column alias needs to be set, not H
        valCell.value = value;
        valCell.numFmt = '#,##0';
        valCell.alignment = { vertical: 'middle', horizontal: 'right' };
        valCell.font = { bold: true, size: isTotal ? 12 : 11, color: isTotal ? { argb: 'FFFF0000' } : undefined };

        currentRowIdx++;
    };

    addSummaryRow('합계', grandTotal);
    addSummaryRow('여행사 수수료', fee);
    addSummaryRow('VAT', vat);
    addSummaryRow('TOTAL', finalTotal, true);

    // Merge "예상 총 경비" (A col) across the 4 rows
    sheet.mergeCells(`A${summaryStartRow}:A${currentRowIdx - 1}`);
    const summaryLabel = sheet.getCell(`A${summaryStartRow}`);
    summaryLabel.value = '예상 총 경비';
    summaryLabel.alignment = { vertical: 'middle', horizontal: 'center' };
    summaryLabel.font = { bold: true, size: 11 };
    summaryLabel.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF5F5F5' } };

    // Apply borders to summary section
    for (let r = summaryStartRow; r < currentRowIdx; r++) {
        sheet.getRow(r).eachCell(cell => {
            cell.border = {
                top: { style: 'thin', color: { argb: 'FFCCCCCC' } },
                bottom: { style: 'thin', color: { argb: 'FFCCCCCC' } },
                right: { style: 'thin', color: { argb: 'FFCCCCCC' } }
            };
        });
    }

    // Draw Outer Border for Summary Table
    drawOuterBorder(summaryStartRow, currentRowIdx - 1);

    // --- 6-2. Footer: 회사 정보 + 인감도장 이미지 (웹 출력과 동일) ---
    currentRowIdx += 2; // spacer
    const footerStartRow = currentRowIdx;

    // 회사 정보 (왼쪽 정렬)
    const companyLines = [
        { text: '(주)하나투어', bold: true },
        { text: '서울시 종로구 인사동 5길 41', bold: false },
        { text: 'TEL: 1577-1233 | FAX: 02-1234-5678', bold: false },
    ];
    companyLines.forEach((line) => {
        sheet.mergeCells(`A${currentRowIdx}:E${currentRowIdx}`);
        const cell = sheet.getCell(currentRowIdx, 1);
        cell.value = line.text;
        cell.font = { size: 10, bold: line.bold, name: 'Malgun Gothic' };
        cell.alignment = { vertical: 'middle', horizontal: 'left' };
        currentRowIdx++;
    });

    // 인감 도장 이미지 (웹과 동일: 원형 + "(인)" placeholder, 오른쪽 정렬)
    try {
        const { buffer: stampBuffer, width: stampW, height: stampH } = await createStampPlaceholderImage();
        if (stampW > 0 && stampH > 0) {
            const stampId = workbook.addImage({ buffer: stampBuffer, extension: 'png' });
            const stampSize = 64;
            // 도장을 회사 정보와 같은 영역 오른쪽에 배치 (row 0-based, col 6~7 영역)
            sheet.addImage(stampId, {
                tl: { col: 6.2, row: footerStartRow - 1 + 0.1 },
                ext: { width: stampSize, height: stampSize },
                editAs: 'oneCell',
            });
        }
    } catch (e) {
        console.warn('Stamp image failed', e);
    }

    // --- 7. Save ---
    const buffer = await workbook.xlsx.writeBuffer();
    // Convert to Uint8Array to handle Node Buffer vs ArrayBuffer environments correctly
    const blob = new Blob([new Uint8Array(buffer as any)], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

    // Standardized Filename
    const fileName = generateSafeFilename('견적산출내역서', quoteTitle || meta?.title);
    saveAs(blob, fileName);
}
