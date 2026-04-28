import { afterEach, describe, expect, it, vi } from "vitest";
import * as ExcelJS from "exceljs";
import JSZip from "jszip";
import type { NextRequest } from "next/server";

vi.mock("@/lib/auth", () => ({
  getApiToken: vi.fn(async () => ({ sub: "test-user" })),
}));

afterEach(() => {
  vi.restoreAllMocks();
  vi.resetModules();
  vi.unmock("pdf-parse");
});

async function makeHwpxFile(): Promise<File> {
  const zip = new JSZip();
  zip.file(
    "Contents/section0.xml",
    [
      '<?xml version="1.0" encoding="UTF-8"?>',
      "<hp:sec xmlns:hp=\"http://www.hancom.co.kr/hwpml/2016/paragraph\">",
      "<hp:t>제1일 싱가포르</hp:t>",
      "<hp:t>조:호텔식</hp:t>",
      "<hp:t>오전 자유일정 후 가이드 미팅</hp:t>",
      "<hp:t>석:송파바쿠테</hp:t>",
      "<hp:t>HOTEL - Aloft Singapore Novena</hp:t>",
      "</hp:sec>",
    ].join(""),
  );
  const buffer = await zip.generateAsync({ type: "arraybuffer" });
  return new File([buffer], "singapore.hwpx", {
    type: "application/hwp+zip",
  });
}

async function makeXlsxWithDisplayedTimes(): Promise<File> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("일정");
  worksheet.addRow(["제1일", "사마르칸트", "", "", "호텔 조식 후", "", "조:", "호텔식"]);
  worksheet.addRow(["", "", "아프로시압", new Date(1899, 11, 30, 16, 51), "사마르칸트 출발"]);
  worksheet.addRow(["", "타슈켄트", "", new Date(1899, 11, 30, 19, 17), "타슈켄트 도착"]);
  worksheet.getCell("D2").numFmt = "hh:mm";
  worksheet.getCell("D3").numFmt = "hh:mm";
  const buffer = await workbook.xlsx.writeBuffer();
  return new File([buffer], "samarkand.xlsx", {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}

async function makeXlsxWithNumericTimeCell(): Promise<File> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("일정");
  worksheet.addRow(["제 02일", "타슈켄트", "", "", "호텔 조식 후", "", "조:", "호텔식"]);
  worksheet.addRow(["3/18(화)", "", "", 10 / 24, "가이드 미팅", "", "중:", "현지식"]);
  worksheet.addRow(["", "", "", "", "타슈켄트에서 유명한 화이트 모스크 미노르 모스크", "", "석:", "현지식"]);
  worksheet.getCell("D2").numFmt = "hh:mm";
  const buffer = await workbook.xlsx.writeBuffer();
  return new File([buffer], "tashkent-time.xlsx", {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}

async function makeXlsxWithSparseRows(): Promise<File> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("일정");
  worksheet.getCell("A1").value = "제1일";
  worksheet.getCell("E1").value = "호텔 조식 후";
  worksheet.getCell("G1").value = "조:";
  worksheet.getCell("H1").value = "호텔식";
  worksheet.getCell("E2").value = "레기스탄 광장";
  worksheet.getCell("G2").value = "중:";
  worksheet.getCell("H2").value = "현지식";
  worksheet.getCell("E3").value = "숙 소 : LOTTE CITY HOTEL TASHKENT PALAE 4*";
  const buffer = await workbook.xlsx.writeBuffer();
  return new File([buffer], "sparse.xlsx", {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}

async function makeXlsxWithDateCells(): Promise<File> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("일정");
  worksheet.addRow(["우즈베키스탄 6일", "일정표"]);
  worksheet.addRow(["일자(날짜)", "지역", "교통편", "시간", "내용", "", "조:", "식사"]);
  worksheet.addRow([1, new Date(2025, 2, 17), "OZ", "01:02", "인천 출발", "", "조:", "호텔식"]);
  worksheet.addRow(["", "", "전용버스", "", "가이드 미팅 후 호텔 이동"]);
  worksheet.addRow(["", "", "", "", "숙 소 : LOTTE CITY HOTEL TASHKENT PALAE 4*"]);
  worksheet.addRow([2, new Date(2025, 2, 18), "", "", "호텔 조식 후 사마르칸트 이동", "", "조:", "호텔식"]);
  worksheet.addRow(["", "", "", "", "숙 소 : HILTON GARDEN INN 4*"]);
  worksheet.addRow(["♣ 상기 일정은 항공 및 현지 사정에의해 변경될 수 있습니다. ♣"]);
  worksheet.getColumn(2).numFmt = "yyyy-mm-dd";
  const buffer = await workbook.xlsx.writeBuffer();
  return new File([buffer], "uzbekistan.xlsx", {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}

describe("/api/itinerary/parse", () => {
  it("rejects legacy .xls files with a clear conversion message", async () => {
    process.env.NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET || "test-secret";
    process.env.DATABASE_URL = process.env.DATABASE_URL || "file:./test.db";
    process.env.OPENAI_API_KEY = "";
    vi.resetModules();

    const { POST } = await import("./route");
    const formData = new FormData();
    formData.append(
      "file",
      new File(["legacy excel"], "singapore.xls", {
        type: "application/vnd.ms-excel",
      }),
    );

    const request = {
      formData: async () => formData,
    } as unknown as NextRequest;

    const response = await POST(request);
    const payload = (await response.json()) as {
      itinerary?: {
        days?: Array<{
          items?: Array<{
            type?: string;
            mealSlot?: string;
            meal?: { breakfast?: string; dinner?: string };
          }>;
        }>;
      };
      error?: string;
    };

    expect(response.status).toBe(422);
    expect(payload.error).toContain("구형 Excel(.xls)은 보안상 지원하지 않습니다");
  });

  it("extracts text from .hwpx files before parsing the itinerary", async () => {
    process.env.NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET || "test-secret";
    process.env.DATABASE_URL = process.env.DATABASE_URL || "file:./test.db";
    process.env.OPENAI_API_KEY = "";
    vi.resetModules();

    const { POST } = await import("./route");
    const formData = new FormData();
    formData.append("file", await makeHwpxFile());

    const request = {
      formData: async () => formData,
    } as unknown as NextRequest;

    const response = await POST(request);
    const payload = (await response.json()) as {
      itinerary?: {
        days?: Array<{
          items?: Array<{
            type?: string;
            mealSlot?: string;
            meal?: { breakfast?: string; dinner?: string };
          }>;
        }>;
      };
      error?: string;
    };

    expect(payload.error).toBeUndefined();
    expect(response.status).toBe(200);
    const items = payload.itinerary?.days?.[0]?.items ?? [];
    expect(items.find((item) => item.mealSlot === "breakfast")?.meal?.breakfast).toBe("호텔식");
    expect(items.find((item) => item.mealSlot === "dinner")?.meal?.dinner).toBe("송파바쿠테");
  });

  it("keeps displayed Excel time cells as HH:mm values", async () => {
    process.env.NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET || "test-secret";
    process.env.DATABASE_URL = process.env.DATABASE_URL || "file:./test.db";
    process.env.OPENAI_API_KEY = "";
    vi.resetModules();

    const { POST } = await import("./route");
    const formData = new FormData();
    formData.append("file", await makeXlsxWithDisplayedTimes());

    const request = {
      formData: async () => formData,
    } as unknown as NextRequest;

    const response = await POST(request);
    const payload = (await response.json()) as {
      itinerary?: {
        days?: Array<{
          items?: Array<{
            type?: string;
            content?: string;
            time?: string;
            mealSlot?: string;
            meal?: { breakfast?: string };
          }>;
        }>;
      };
      error?: string;
    };

    expect(payload.error).toBeUndefined();
    expect(response.status).toBe(200);
    const items = payload.itinerary?.days?.[0]?.items ?? [];
    expect(items.find((item) => item.mealSlot === "breakfast")?.meal?.breakfast).toBe("호텔식");
    expect(items.find((item) => item.content?.includes("사마르칸트 출발"))?.time).toBe("16:51");
    expect(items.find((item) => item.content?.includes("타슈켄트 도착"))?.time).toBe("19:17");
  });

  it("keeps numeric Excel time cells as displayed HH:mm values", async () => {
    process.env.NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET || "test-secret";
    process.env.DATABASE_URL = process.env.DATABASE_URL || "file:./test.db";
    process.env.OPENAI_API_KEY = "";
    vi.resetModules();

    const { POST } = await import("./route");
    const formData = new FormData();
    formData.append("file", await makeXlsxWithNumericTimeCell());

    const request = {
      formData: async () => formData,
    } as unknown as NextRequest;

    const response = await POST(request);
    const payload = (await response.json()) as {
      itinerary?: {
        days?: Array<{
          items?: Array<{
            content?: string;
            time?: string;
            mealSlot?: string;
            meal?: { breakfast?: string; lunch?: string; dinner?: string };
          }>;
        }>;
      };
      error?: string;
    };

    expect(payload.error).toBeUndefined();
    expect(response.status).toBe(200);
    const items = payload.itinerary?.days?.[0]?.items ?? [];
    expect(items.find((item) => item.content === "가이드 미팅")?.time).toBe("10:00");
    expect(items.map((item) => item.content)).toContain("타슈켄트에서 유명한 화이트 모스크 미노르 모스크");
    expect(items.find((item) => item.mealSlot === "breakfast")?.meal?.breakfast).toBe("호텔식");
    expect(items.find((item) => item.mealSlot === "lunch")?.meal?.lunch).toBe("현지식");
    expect(items.find((item) => item.mealSlot === "dinner")?.meal?.dinner).toBe("현지식");
  });

  it("handles sparse Excel rows without failing on blank cells", async () => {
    process.env.NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET || "test-secret";
    process.env.DATABASE_URL = process.env.DATABASE_URL || "file:./test.db";
    process.env.OPENAI_API_KEY = "";
    vi.resetModules();

    const { POST } = await import("./route");
    const formData = new FormData();
    formData.append("file", await makeXlsxWithSparseRows());

    const request = {
      formData: async () => formData,
    } as unknown as NextRequest;

    const response = await POST(request);
    const payload = (await response.json()) as {
      itinerary?: {
        days?: Array<{
          items?: Array<{
            mealSlot?: string;
            meal?: { breakfast?: string; lunch?: string };
          }>;
        }>;
      };
      error?: string;
    };

    expect(payload.error).toBeUndefined();
    expect(response.status).toBe(200);
    const items = payload.itinerary?.days?.[0]?.items ?? [];
    expect(items.find((item) => item.mealSlot === "breakfast")?.meal?.breakfast).toBe("호텔식");
    expect(items.find((item) => item.mealSlot === "lunch")?.meal?.lunch).toBe("현지식");
  });

  it("keeps numeric day rows and date cells out of itinerary content", async () => {
    process.env.NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET || "test-secret";
    process.env.DATABASE_URL = process.env.DATABASE_URL || "file:./test.db";
    process.env.OPENAI_API_KEY = "";
    vi.resetModules();

    const { POST } = await import("./route");
    const formData = new FormData();
    formData.append("file", await makeXlsxWithDateCells());

    const request = {
      formData: async () => formData,
    } as unknown as NextRequest;

    const response = await POST(request);
    const payload = (await response.json()) as {
      itinerary?: {
        days?: Array<{
          dayNo?: number;
          items?: Array<{
            type?: string;
            content?: string;
          }>;
        }>;
      };
      error?: string;
    };

    expect(payload.error).toBeUndefined();
    expect(response.status).toBe(200);
    expect(payload.itinerary?.days?.map((day) => day.dayNo)).toEqual([1, 2]);
    const dayOneContents = payload.itinerary?.days?.[0]?.items?.map((item) => item.content ?? "") ?? [];
    const dayTwoContents = payload.itinerary?.days?.[1]?.items?.map((item) => item.content ?? "") ?? [];
    expect(dayOneContents.some((content) => content.includes("우즈베키스탄"))).toBe(false);
    expect(dayOneContents.some((content) => content.includes("Mon Mar"))).toBe(false);
    expect(dayOneContents.some((content) => content.includes("상기 일정"))).toBe(false);
    expect(dayOneContents.some((content) => content.includes("1 |"))).toBe(false);
    expect(dayOneContents).toContain("LOTTE CITY HOTEL TASHKENT PALAE 4*");
    expect(dayOneContents).not.toContain("HILTON GARDEN INN 4*");
    expect(dayTwoContents).toContain("HILTON GARDEN INN 4*");
  });

  it("uses OCR fallback when uploaded PDF has no extractable text", async () => {
    process.env.NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET || "test-secret";
    process.env.DATABASE_URL = process.env.DATABASE_URL || "file:./test.db";
    process.env.OPENAI_API_KEY = "test-key";
    vi.resetModules();

    const getText = vi.fn(async () => ({ text: "\n-- 1 of 2 --\n\n-- 2 of 2 --\n" }));
    const getScreenshot = vi.fn(async () => ({
      pages: [
        { dataUrl: "data:image/png;base64,page-one" },
        { dataUrl: "data:image/png;base64,page-two" },
      ],
    }));
    const destroy = vi.fn(async () => undefined);

    vi.doMock("pdf-parse", () => ({
      PDFParse: vi.fn(() => ({
        getText,
        getScreenshot,
        destroy,
      })),
    }));

    const fetchMock = vi.fn(async (_url: string | URL | Request, init?: RequestInit) => {
      const body = JSON.parse(String(init?.body)) as {
        messages?: Array<{ content?: unknown }>;
        response_format?: { type: string };
      };
      const firstContent = body.messages?.[0]?.content;

      if (Array.isArray(firstContent)) {
        return Response.json({
          choices: [
            {
              message: {
                content: "제1일 | 상해 | 전용버스 | 09:00 | 상해 도착 후 호텔 이동\n제2일 | 항주 | 전용버스 | 10:00 | 서호 관광",
              },
            },
          ],
        });
      }

      if (!body.response_format) {
        return Response.json({
          choices: [
            {
              message: {
                content: `[AI 분석 결과]
상품명: 상해항주황산 테스트
출발일: 2026-04-05

[일차별 일정]
1일차 | TRANSFER | 상해 도착 후 호텔 이동 |  | 09:00 |
2일차 | SIGHTSEEING | 서호 관광 |  | 10:00 |`,
              },
            },
          ],
        });
      }

      return Response.json({
        choices: [
          {
            message: {
              content: JSON.stringify({
                overview: { travelPeriod: { start: "2026-04-05", end: "2026-04-06" } },
                days: [
                  { dayNo: 1, items: [{ type: "TRANSFER", time: "09:00", content: "상해 도착 후 호텔 이동" }] },
                  { dayNo: 2, items: [{ type: "SIGHTSEEING", time: "10:00", content: "서호 관광" }] },
                ],
              }),
            },
          },
        ],
      });
    });
    vi.stubGlobal("fetch", fetchMock);

    const { POST } = await import("./route");
    const formData = new FormData();
    formData.append("file", new File(["fake pdf"], "scan.pdf", { type: "application/pdf" }));

    const request = {
      formData: async () => formData,
    } as unknown as NextRequest;

    const response = await POST(request);
    const payload = (await response.json()) as {
      itinerary?: {
        days?: Array<{
          items?: Array<{
            content?: string;
          }>;
        }>;
      };
      error?: string;
    };

    expect(payload.error).toBeUndefined();
    expect(response.status).toBe(200);
    expect(getScreenshot).toHaveBeenCalledWith({
      desiredWidth: 1600,
      first: 6,
      imageBuffer: false,
      imageDataUrl: true,
    });
    expect(fetchMock).toHaveBeenCalledTimes(3);
    const contents = payload.itinerary?.days?.flatMap((day) => day.items?.map((item) => item.content ?? "") ?? []) ?? [];
    expect(contents).toContain("상해 도착 후 호텔 이동");
    expect(contents).toContain("서호 관광");
  });
});
