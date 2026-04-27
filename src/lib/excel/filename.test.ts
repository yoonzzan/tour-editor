// src/lib/excel/filename.test.ts — T-701 유닛 테스트
import { describe, it, expect } from "vitest";
import { generateExcelFilename } from "./filename";

const FIXED_DATE = new Date("2026-04-16T00:00:00");

describe("generateExcelFilename", () => {
  it("여행일정표 — 기본 형식", () => {
    expect(
      generateExcelFilename({
        quoteCode: "QA0058262301",
        bidCode: "1209",
        productName: "쿨인싱아웃4박",
        type: "itinerary",
        date: FIXED_DATE,
      })
    ).toBe("여행일정표_쿨인싱아웃4박_1209_QA0058262301_2026-04-16.xlsx");
  });

  it("견적산출내역서 — 기본 형식", () => {
    expect(
      generateExcelFilename({
        quoteCode: "QC00687628001",
        bidCode: "1209",
        productName: "쿨인싱아웃4박",
        type: "cost",
        date: FIXED_DATE,
      })
    ).toBe("견적산출내역서_쿨인싱아웃4박_1209_QC00687628001_2026-04-16.xlsx");
  });

  it("날짜 없으면 오늘 날짜로 파일명 생성 (형식 검증)", () => {
    const result = generateExcelFilename({
      quoteCode: "QA001",
      bidCode: "QA001",
      productName: "상품명",
      type: "cost",
    });
    expect(result).toMatch(/^견적산출내역서_상품명_QA001_QA001_\d{4}-\d{2}-\d{2}\.xlsx$/);
  });
});
