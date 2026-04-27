// src/app/api/quotes/[id]/export/route.ts — T-705 + T-706 + T-707
// GET /api/quotes/[id]/export?type=itinerary|cost[&version=v1.2]
// POST /api/quotes/[id]/export?type=itinerary|cost
// POST 바디에 미리보기 상태(itineraryData/quoteData)를 보내면 즉시 반영 다운로드 가능

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { db } from "@/lib/db";
import type ExcelJS from "exceljs";
import { generateItineraryWorkbook } from "@/lib/excel/generateItinerary";
import { generateCostWorkbook } from "@/lib/excel/generateCostSheet";
import { generateExcelFilename } from "@/lib/excel/filename";
import { todayInKorea } from "@/lib/date/korea";
import type {
  ItineraryData,
  QuoteCategory,
  QuoteData,
  QuoteExchangeRate,
  QuoteItem,
} from "@/types";
import {
  DEFAULT_EXCHANGE_RATE_ID,
  getQuoteExchangeRates,
  recalculateQuoteData,
} from "@/lib/quote/currency";
import { getApiToken } from "@/lib/auth";
import {
  assertQuoteAccessByQuoteId,
  QuoteAccessError,
  toQuoteAccessResponse,
} from "@/lib/auth/quoteAccess";

const CATEGORY_SET = new Set<QuoteCategory>([
  "FLIGHT",
  "HOTEL",
  "SIGHTSEEING",
  "MEAL",
  "VEHICLE",
  "GUIDE",
  "OTHER",
]);

const CATEGORY_ALIAS: Record<string, QuoteCategory> = {
  FLIGHT: "FLIGHT",
  항공: "FLIGHT",
  HOTEL: "HOTEL",
  숙박: "HOTEL",
  SIGHTSEEING: "SIGHTSEEING",
  관광: "SIGHTSEEING",
  MEAL: "MEAL",
  식사: "MEAL",
  VEHICLE: "VEHICLE",
  차량: "VEHICLE",
  GUIDE: "GUIDE",
  가이드: "GUIDE",
  OTHER: "OTHER",
  기타: "OTHER",
  "": "OTHER",
};

type ExportType = "itinerary" | "cost";

interface PreviewExportPayload {
  itineraryData?: unknown;
  quoteData?: unknown;
}

function createFallbackItemId(index: number): string {
  return `item-${Date.now().toString(36)}-${index.toString(36)}`;
}

function toSafeString(value: unknown): string {
  if (typeof value === "string") return value.trim();
  return "";
}

function toSafeNumber(value: unknown, fallback: number): number {
  if (typeof value === "number") return Number.isFinite(value) ? value : fallback;
  if (typeof value === "string") {
    const normalized = value.replace(/,/g, "").trim();
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  return fallback;
}

function normalizeCategory(value: unknown): QuoteCategory {
  if (typeof value !== "string") return "OTHER";
  const normalized = value.trim().toUpperCase().replace(/\s+/g, "");
  const matched = CATEGORY_SET.has(normalized as QuoteCategory)
    ? (normalized as QuoteCategory)
    : CATEGORY_ALIAS[value] ?? CATEGORY_ALIAS[normalized];
  return matched ?? "OTHER";
}

function normalizeQuoteItem(item: unknown, index: number): QuoteItem {
  const source = (item as Record<string, unknown>) ?? {};
  const region =
    toSafeString(source.region) ||
    toSafeString(source.location) ||
    "";
  const date = toSafeString(source.date);
  const description =
    toSafeString(source.description) ||
    toSafeString(source.detail) ||
    toSafeString(source.name) ||
    toSafeString(source.content) ||
    "(내용 없음)";
  const quantity = toSafeNumber(
    source.quantity,
    toSafeNumber(source.qtyAdult, toSafeNumber(source.qty, 1))
  );
  const unitPrice = toSafeNumber(source.unitPrice, toSafeNumber(source.price, 0));
  const currencyRateId = toSafeString(source.currencyRateId) || DEFAULT_EXCHANGE_RATE_ID;
  const subtotal = toSafeNumber(source.subtotal, toSafeNumber(source.totalPriceKrw, 0));
  return {
    id: toSafeString(source.id) || createFallbackItemId(index),
    category: normalizeCategory(source.category),
    region,
    date,
    description,
    quantity,
    unitPrice,
    currencyRateId,
    subtotal,
  };
}

function normalizeExchangeRates(value: unknown): QuoteExchangeRate[] {
  if (!Array.isArray(value)) return getQuoteExchangeRates(null);
  return getQuoteExchangeRates({
    exchangeRates: value.map((raw, index) => {
      const source = (raw as Record<string, unknown>) ?? {};
      return {
        id: toSafeString(source.id) || `rate-${index.toString(36)}`,
        code: toSafeString(source.code) || "KRW",
        rateToKrw: toSafeNumber(source.rateToKrw, 1),
      };
    }),
  });
}

function hasItemRows(data: QuoteData | undefined): boolean {
  return !!data && Array.isArray(data.items) && data.items.length > 0;
}

function toSafeQuoteData(raw: unknown): QuoteData {
  const payload = (raw as Record<string, unknown>) ?? {};
  const rawItems = Array.isArray(payload.items)
    ? payload.items
    : Array.isArray(payload.quoteItems)
      ? payload.quoteItems
      : [];

  const items = rawItems.map((item, index) => normalizeQuoteItem(item, index));
  const headerSource = (payload.header as Record<string, unknown>) ?? {};
  const writtenAt = toSafeString(headerSource.writtenAt) || todayInKorea();
  const header = {
    writtenAt,
    validUntil: toSafeString(headerSource.validUntil) || writtenAt,
  };
  const exchangeRates = normalizeExchangeRates(payload.exchangeRates);
  const summarySource = (payload.summary as Record<string, unknown>) ?? {};
  const groundProfit = toSafeNumber(summarySource.groundProfit, 0);
  const agencyFee = toSafeNumber(summarySource.agencyFee, 0);

  const computed = recalculateQuoteData({
    header,
    exchangeRates,
    items,
    groundProfit,
    agencyFee,
  });

  return computed;
}

function parseExportType(value: string | null): ExportType | null {
  if (value === "itinerary" || value === "cost") {
    return value;
  }
  return null;
}

function parsePayload(raw: unknown): PreviewExportPayload | null {
  if (raw === null || raw === undefined) return null;
  if (typeof raw !== "object") return null;
  const source = raw as Record<string, unknown>;
  return {
    itineraryData: source.itineraryData,
    quoteData: source.quoteData,
  };
}

async function parsePostPayload(request: NextRequest): Promise<PreviewExportPayload> {
  try {
    const payload = await request.json();
    return parsePayload(payload) ?? {};
  } catch {
    return {};
  }
}

async function loadVersionData(quoteId: string, versionNo: string): Promise<{
  itineraryData: ItineraryData;
  quoteData: QuoteData;
} | null> {
  const version = await db.quoteVersion.findUnique({
    where: {
      quoteId_versionNo: { quoteId, versionNo },
    },
    select: {
      itineraryData: true,
      quoteData: true,
    },
  });

  if (!version) return null;

  try {
    return {
      itineraryData: JSON.parse(version.itineraryData) as ItineraryData,
      quoteData: toSafeQuoteData(JSON.parse(version.quoteData)),
    };
  } catch {
    return null;
  }
}

async function resolveDataByRequest(
  id: string,
  type: ExportType,
  targetVersion: string,
  payload: PreviewExportPayload | null
): Promise<{ itineraryData: ItineraryData; quoteData: QuoteData } | null> {
  let itineraryData: ItineraryData | undefined;
  let quoteData: QuoteData | undefined;

  if (type === "itinerary" && payload?.itineraryData) {
    itineraryData = payload.itineraryData as ItineraryData;
  }
  if (type === "cost" && payload?.quoteData) {
    quoteData = toSafeQuoteData(payload.quoteData);
  }

  if (!itineraryData || !hasItemRows(quoteData)) {
    const saved = await loadVersionData(id, targetVersion);
    if (!saved) return null;
    itineraryData = itineraryData ?? saved.itineraryData;
    if (!hasItemRows(quoteData)) {
      quoteData = saved.quoteData;
    }
  }

  if (!quoteData) return null;

  return { itineraryData, quoteData };
}

async function writeResponse({
  quoteId,
  type,
  payload,
}: {
  quoteId: string;
  type: ExportType;
  payload: { itineraryData: ItineraryData; quoteData: QuoteData };
}) {
  const quote = await db.quote.findUnique({
    where: { id: quoteId },
    select: {
      quoteCode: true,
      bid: { select: { bidCode: true, title: true } },
    },
  });

  if (!quote) {
    return NextResponse.json(
      { error: "견적을 찾을 수 없습니다." },
      { status: 404 }
    );
  }

  let buffer: ExcelJS.Buffer;
  try {
    if (type === "itinerary") {
      buffer = await generateItineraryWorkbook(payload.itineraryData, {
        productName: quote.bid.title,
        bidCode: quote.bid.bidCode,
      });
    } else {
      buffer = await generateCostWorkbook(payload.quoteData, {
        productName: quote.bid.title,
        bidCode: quote.bid.bidCode,
      });
    }
  } catch (err) {
    // eslint-disable-next-line no-console -- 서버 에러 로깅 필수
    console.error("[export] Excel 생성 오류", err);
    return NextResponse.json(
      { error: "Excel 생성 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }

  const filename = generateExcelFilename({
    quoteCode: quote.quoteCode,
    bidCode: quote.bid.bidCode,
    productName: quote.bid.title,
    type,
  });
  const encodedFilename = encodeURIComponent(filename);
  const contentDisposition = `attachment; filename*=UTF-8''${encodedFilename}`;

  return new NextResponse(buffer as ArrayBuffer, {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": contentDisposition,
      "Cache-Control": "no-store",
    },
  });
}

async function handleExport(req: NextRequest, id: string, method: "GET" | "POST") {
  const searchParams = req.nextUrl.searchParams;
  const type = parseExportType(searchParams.get("type"));
  if (type === null) {
    return NextResponse.json(
      { error: "type 파라미터는 'itinerary' 또는 'cost' 이어야 합니다." },
      { status: 400 }
    );
  }

  const quote = await db.quote.findUnique({
    where: { id },
    select: {
      quoteCode: true,
      latestVersion: true,
      bid: { select: { bidCode: true, title: true } },
    },
  });

  if (!quote) {
    return NextResponse.json(
      { error: "견적을 찾을 수 없습니다." },
      { status: 404 }
    );
  }

  const targetVersion = (searchParams.get("version") ?? quote.latestVersion);
  const payload = method === "POST" ? await parsePostPayload(req) : null;
  const data = await resolveDataByRequest(id, type, targetVersion, payload);

  if (!data) {
    return NextResponse.json(
      { error: `버전을 찾을 수 없습니다: ${targetVersion}` },
      { status: 404 }
    );
  }

  return writeResponse({
    quoteId: id,
    type,
    payload: data,
  });
}

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const token = await getApiToken(req);
  if (!token?.sub) {
    return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
  }
  const { id } = await context.params;
  try {
    await assertQuoteAccessByQuoteId(token, id);
  } catch (err) {
    if (err instanceof QuoteAccessError) {
      return NextResponse.json(toQuoteAccessResponse(err), {
        status: err.status,
      });
    }
    throw err;
  }
  return handleExport(req, id, "GET");
}

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const token = await getApiToken(req);
  if (!token?.sub) {
    return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
  }
  const { id } = await context.params;
  try {
    await assertQuoteAccessByQuoteId(token, id);
  } catch (err) {
    if (err instanceof QuoteAccessError) {
      return NextResponse.json(toQuoteAccessResponse(err), {
        status: err.status,
      });
    }
    throw err;
  }
  return handleExport(req, id, "POST");
}
