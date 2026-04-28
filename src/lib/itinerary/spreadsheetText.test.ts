import { describe, expect, it } from "vitest";
import { normalizeSpreadsheetCell, spreadsheetRowsToText } from "./spreadsheetText";

describe("spreadsheetRowsToText", () => {
  it("preserves empty middle columns so schedule headers keep row alignment", () => {
    const text = spreadsheetRowsToText([
      ["DATE", "CITY", "TRSFT", "TIME", "ITINERARY", "MEALS"],
      ["제1일", "인천", undefined, undefined, "인천 국제 공항 3층 집결 및 가이드 미팅", undefined],
      ["2/28", undefined, "BX", "12:35", "인천 국제 공항 출발", undefined],
      [undefined, "신치토세", "전용버스", "15:30", "신치토세 공항 도착", "L: 불포함"],
    ]);

    expect(text).toBe([
      "DATE\tCITY\tTRSFT\tTIME\tITINERARY\tMEALS",
      "제1일\t인천\t\t\t인천 국제 공항 3층 집결 및 가이드 미팅",
      "2/28\t\tBX\t12:35\t인천 국제 공항 출발",
      "\t신치토세\t전용버스\t15:30\t신치토세 공항 도착\tL: 불포함",
    ].join("\n"));
  });
});

describe("normalizeSpreadsheetCell", () => {
  it("extracts display text from ExcelJS object cells without leaking object strings", () => {
    expect(normalizeSpreadsheetCell({ text: "https", hyperlink: "https://example.com" })).toBe("https");
    expect(normalizeSpreadsheetCell({ richText: [{ text: "소운쿄" }, { text: " 이동." }] })).toBe("소운쿄 이동.");
    expect(normalizeSpreadsheetCell({ formula: "A1", result: "호텔식" })).toBe("호텔식");
    expect(normalizeSpreadsheetCell({ error: "#VALUE!" })).toBe("");
  });

  it("normalizes JavaScript date strings emitted by spreadsheet readers", () => {
    expect(normalizeSpreadsheetCell("Tue Mar 18 2025 00:00:00 GMT+0900 (Korean Standard Time)")).toBe("2025-03-18");
  });
});
