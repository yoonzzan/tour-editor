import * as ExcelJS from "exceljs";
import JSZip from "jszip";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getApiToken } from "@/lib/auth";
import { config } from "@/lib/config";
import { parseItineraryWithDiagnostics } from "@/lib/itinerary/aiParser";
import { spreadsheetRowsToText } from "@/lib/itinerary/spreadsheetText";

export const runtime = "nodejs";

const UNSUPPORTED_XLS_MESSAGE = "구형 Excel(.xls)은 보안상 지원하지 않습니다. Excel에서 .xlsx로 저장한 뒤 다시 업로드해 주세요.";
const UNSUPPORTED_HWP_MESSAGE = "구형 한글(.hwp)은 아직 지원하지 않습니다. .hwpx 또는 PDF로 저장한 뒤 업로드해 주세요.";
const PDF_OCR_MAX_PAGES = 6;
const PDF_OCR_IMAGE_WIDTH = 1600;
const PDF_TEXT_MIN_CHARS = 80;

type OcrMessageContent =
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string } };

interface OcrChatChoice {
  message?: {
    content?: string | null;
  };
}

interface OcrChatCompletionResponse {
  choices?: OcrChatChoice[];
}

function normalizeExcelDate(date: Date): string {
  const year = date.getFullYear();
  if (year <= 1901) return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
  return `${year}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function normalizeExcelTimeDate(date: Date): string {
  const hasHistoricalTimezoneRemainder = date.getSeconds() !== 0 || date.getMilliseconds() !== 0;
  const hours = hasHistoricalTimezoneRemainder ? date.getUTCHours() : date.getHours();
  const minutes = hasHistoricalTimezoneRemainder ? date.getUTCMinutes() : date.getMinutes();
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function excelResultValue(value: ExcelJS.CellValue): unknown {
  if (typeof value !== "object" || value === null || value instanceof Date) return value;
  const result = (value as { result?: unknown }).result;
  return result ?? value;
}

function excelCellDisplayValue(cell: ExcelJS.Cell): unknown {
  const value = excelResultValue(cell.value);
  if (value === null || value === undefined) return "";
  if (value instanceof Date) {
    if (value.getFullYear() <= 1901) {
      if (value.getSeconds() !== 0 || value.getMilliseconds() !== 0) {
        return normalizeExcelTimeDate(value);
      }
      const text = cell.text;
      const timeText = /\b([01]?\d|2[0-3]):([0-5]\d)(?::[0-5]\d)?\b/u.exec(text);
      if (timeText?.[1] && timeText[2]) {
        return `${timeText[1].padStart(2, "0")}:${timeText[2]}`;
      }
      return normalizeExcelTimeDate(value);
    }
    return normalizeExcelDate(value);
  }
  const text = cell.text;
  return text || value;
}

async function spreadsheetToText(file: File): Promise<string> {
  const workbook = new ExcelJS.Workbook();
  const arrayBuffer = await file.arrayBuffer();
  await workbook.xlsx.load(arrayBuffer);
  const worksheet = workbook.worksheets[0];
  if (!worksheet) return "";

  const rows: unknown[][] = [];
  const columnCount = worksheet.columnCount;
  worksheet.eachRow({ includeEmpty: true }, (row) => {
    const values: unknown[] = [];
    for (let column = 1; column <= columnCount; column += 1) {
      values.push(excelCellDisplayValue(row.getCell(column)));
    }
    rows.push(values);
  });

  return spreadsheetRowsToText(rows);
}

function stripPdfPageMarkers(text: string): string {
  return text
    .replace(/--\s*\d+\s+of\s+\d+\s*--/giu, "\n")
    .replace(/\n{3,}/gu, "\n\n")
    .trim();
}

function isMeaningfulPdfText(text: string): boolean {
  const cleaned = stripPdfPageMarkers(text);
  const compact = cleaned.replace(/\s+/gu, "");
  if (compact.length >= PDF_TEXT_MIN_CHARS) return true;
  return compact.length >= 30 && /(?:견적|일정|호텔|출발|도착|조식|중식|석식|포함|불포함)/u.test(compact);
}

function extractOcrText(payload: OcrChatCompletionResponse): string {
  return payload.choices?.[0]?.message?.content?.trim() ?? "";
}

async function callPdfOcr(pageImages: string[]): Promise<string> {
  if (!config.ai.apiKey) {
    throw new Error("PDF에서 텍스트를 추출하지 못했습니다. 이미지형 PDF라 OCR이 필요하지만 AI API key가 없습니다.");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), config.ai.parseTimeoutMs);
  const content: OcrMessageContent[] = [
    {
      type: "text",
      text: [
        "이미지는 여행 견적서/PDF 일정표 페이지다.",
        "OCR로 보이는 모든 한글/영문/숫자 텍스트를 원문 순서대로 추출해라.",
        "표는 행 단위로 보존하고, 셀 구분이 보이면 | 로 구분해라.",
        "추측하지 말고 이미지에 보이는 텍스트만 출력해라.",
        "설명 없이 추출 텍스트만 출력해라.",
      ].join("\n"),
    },
    ...pageImages.map((url) => ({
      type: "image_url" as const,
      image_url: { url },
    })),
  ];

  try {
    const response = await fetch(`${config.ai.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.ai.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: config.ai.model,
        temperature: 0,
        messages: [
          {
            role: "user",
            content,
          },
        ],
      }),
      signal: controller.signal,
    });

    const payload = (await response.json()) as OcrChatCompletionResponse;
    if (response.ok) {
      const text = extractOcrText(payload);
      if (text) return text;
      throw new Error("PDF OCR 결과가 비어 있습니다.");
    }

    throw new Error(`PDF OCR 호출 실패 (${response.status})`);
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error(`PDF OCR 시간이 ${config.ai.parseTimeoutMs}ms를 초과했습니다.`);
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

async function pdfToText(file: File): Promise<string> {
  const { PDFParse } = await import("pdf-parse");
  const arrayBuffer = await file.arrayBuffer();
  const parser = new PDFParse({ data: new Uint8Array(arrayBuffer) });
  try {
    const result = await parser.getText();
    if (isMeaningfulPdfText(result.text)) return stripPdfPageMarkers(result.text);

    const screenshot = await parser.getScreenshot({
      desiredWidth: PDF_OCR_IMAGE_WIDTH,
      first: PDF_OCR_MAX_PAGES,
      imageBuffer: false,
      imageDataUrl: true,
    });
    const pageImages = screenshot.pages
      .map((page) => page.dataUrl)
      .filter(Boolean);
    if (pageImages.length === 0) return stripPdfPageMarkers(result.text);

    return await callPdfOcr(pageImages);
  } finally {
    await parser.destroy();
  }
}

function decodeXmlEntities(value: string): string {
  return value
    .replace(/&lt;/gu, "<")
    .replace(/&gt;/gu, ">")
    .replace(/&amp;/gu, "&")
    .replace(/&quot;/gu, "\"")
    .replace(/&apos;/gu, "'");
}

function hwpxXmlToText(xml: string): string {
  const textNodes = Array.from(xml.matchAll(/<[\w.-]+:t\b[^>]*>([\s\S]*?)<\/[\w.-]+:t>/giu), (match) =>
    decodeXmlEntities(match[1]?.replace(/<[^>]+>/gu, "") ?? "").trim(),
  ).filter(Boolean);

  if (textNodes.length > 0) return textNodes.join("\n");

  return decodeXmlEntities(xml.replace(/<[^>]+>/gu, "\n"))
    .split(/\n+/u)
    .map((line) => line.trim())
    .filter(Boolean)
    .join("\n");
}

async function hwpxToText(file: File): Promise<string> {
  const zip = await JSZip.loadAsync(await file.arrayBuffer());
  const xmlFiles = Object.values(zip.files)
    .filter((entry) => !entry.dir && entry.name.toLowerCase().endsWith(".xml"))
    .sort((left, right) => left.name.localeCompare(right.name));

  const sections = await Promise.all(xmlFiles.map(async (entry) => hwpxXmlToText(await entry.async("string"))));
  return sections.filter(Boolean).join("\n");
}

async function extractRawText(formData: FormData): Promise<{ rawText: string; title?: string }> {
  const textInput = formData.get("text");
  const titleInput = formData.get("title");
  const fileInput = formData.get("file");

  const title = typeof titleInput === "string" ? titleInput.trim() : undefined;
  if (typeof textInput === "string" && textInput.trim()) {
    return { rawText: textInput, title };
  }

  if (!(fileInput instanceof File)) {
    throw new Error("텍스트 또는 파일이 필요합니다.");
  }

  const name = fileInput.name.toLowerCase();
  const fileTitle = fileInput.name.replace(/\.[^.]+$/u, "");

  if (name.endsWith(".xls") && !name.endsWith(".xlsx")) throw new Error(UNSUPPORTED_XLS_MESSAGE);
  if (name.endsWith(".hwp") && !name.endsWith(".hwpx")) throw new Error(UNSUPPORTED_HWP_MESSAGE);

  if (name.endsWith(".xlsx")) {
    const rawText = await spreadsheetToText(fileInput);
    return { rawText, title: title ?? fileTitle };
  }

  if (name.endsWith(".pdf")) {
    const rawText = await pdfToText(fileInput);
    return { rawText, title: title ?? fileTitle };
  }

  if (name.endsWith(".hwpx")) {
    const rawText = await hwpxToText(fileInput);
    return { rawText, title: title ?? fileTitle };
  }

  const rawText = await fileInput.text();
  return { rawText, title: title ?? fileTitle };
}

export async function POST(req: NextRequest) {
  const token = await getApiToken(req);
  if (!token?.sub) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const { rawText, title } = await extractRawText(formData);
    const result = await parseItineraryWithDiagnostics({ rawText, title });
    return NextResponse.json(result, {
      headers: {
        "x-itinerary-parser-source": result.diagnostics.source,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "파싱 중 오류가 발생했습니다.";
    return NextResponse.json({ error: message }, { status: 422 });
  }
}
