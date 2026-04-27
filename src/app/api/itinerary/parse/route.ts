import * as ExcelJS from "exceljs";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getApiToken } from "@/lib/auth";
import { parseItineraryWithDiagnostics } from "@/lib/itinerary/aiParser";
import { spreadsheetRowsToText } from "@/lib/itinerary/spreadsheetText";

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
      values.push(row.getCell(column).value);
    }
    rows.push(values);
  });

  return spreadsheetRowsToText(rows);
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

  if (name.endsWith(".xlsx") || name.endsWith(".xls")) {
    const rawText = await spreadsheetToText(fileInput);
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
