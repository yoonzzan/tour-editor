import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import type ExcelJS from "exceljs";

const LOGO_PATHS = [
  path.join(process.cwd(), "public", "images", "hanatour-logo-cropped.png"),
  path.join(process.cwd(), "public", "images", "hanatour-logo.png"),
];

interface LogoPlacement {
  colOffset: number;
  rowOffset: number;
  width: number;
  height: number;
}

function getPngDimension(filePath: string): { width: number; height: number } | null {
  try {
    const buffer = readFileSync(filePath);
    if (buffer.length < 24) return null;
    if (
      buffer.readUInt32BE(0) !== 0x89504e47 ||
      buffer.readUInt8(12) !== 73 ||
      buffer.readUInt8(13) !== 72 ||
      buffer.readUInt8(14) !== 68 ||
      buffer.readUInt8(15) !== 82
    ) {
      return null;
    }
    const width = buffer.readUInt32BE(16);
    const height = buffer.readUInt32BE(20);
    if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
      return null;
    }
    return { width, height };
  } catch {
    return null;
  }
}

function getLogoPath(): string {
  for (const logoPath of LOGO_PATHS) {
    if (existsSync(logoPath)) {
      return logoPath;
    }
  }
  throw new Error("하나투어 로고 파일을 찾을 수 없습니다.");
}

export function addHanaTourLogo(
  workbook: ExcelJS.Workbook,
  worksheet: ExcelJS.Worksheet,
  options: Partial<LogoPlacement> = {}
): void {
  const logoPath = getLogoPath();
  const logoId = workbook.addImage({
    filename: logoPath,
    extension: "png",
  });

  const dimension = getPngDimension(logoPath);
  const baseWidth = options.width ?? 158;
  const ratioHeight = dimension ? Math.round((baseWidth * dimension.height) / dimension.width) : Math.round(baseWidth * 0.2);

  const placement: LogoPlacement = {
    colOffset: options.colOffset ?? 0.12,
    rowOffset: options.rowOffset ?? 0.12,
    width: baseWidth,
    height: options.height ?? ratioHeight,
  };

  worksheet.addImage(logoId, {
    tl: { col: placement.colOffset, row: placement.rowOffset },
    ext: {
      width: placement.width,
      height: placement.height,
    },
    editAs: "oneCell",
  });
}
