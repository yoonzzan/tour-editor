// src/lib/excel/filename.ts — T-701
// 예: 여행일정표_쿨인싱아웃4박_1209_QA0058262301_2026-03-18.xlsx
//     견적산출내역서_쿨인싱아웃4박_1209_QA0058262301_2026-03-18.xlsx

export type ExcelType = "itinerary" | "cost";

function sanitizeFilenamePart(text: string): string {
  return text
    .trim()
    .replace(/[\\/:*?"<>|]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function toDateString(input?: Date | string): string {
  const date = input ? new Date(input) : new Date();
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function generateExcelFilename(opts: {
  quoteCode: string;
  bidCode: string;
  productName: string;
  type: ExcelType;
  date?: Date | string; // 기본값: 호출 시점
}): string {
  const {
    quoteCode,
    bidCode,
    productName,
    type,
    date = new Date(),
  } = opts;
  const prefix = type === "itinerary" ? "여행일정표" : "견적산출내역서";
  const dateStr = toDateString(date);
  const safeProductName = sanitizeFilenamePart(productName);
  const safeBidCode = sanitizeFilenamePart(bidCode);
  return `${prefix}_${safeProductName}_${safeBidCode}_${quoteCode}_${dateStr}.xlsx`;
}

export { toDateString, sanitizeFilenamePart };
