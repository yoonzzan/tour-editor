// GET /api/editor/init?quoteNo=QC00687628001
// 팝업 진입 시 최초 1회 호출 — 견적 + 최신 버전 반환
// 견적이 없으면 { quote: null, version: null } 반환 (빈 에디터 시작)

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getApiToken } from "@/lib/auth";
import {
  assertQuoteAccessByQuoteNo,
  QuoteAccessError,
  toQuoteAccessResponse,
} from "@/lib/auth/quoteAccess";
import type { ItineraryData, QuoteData } from "@/types";

export async function GET(req: NextRequest) {
  const token = await getApiToken(req);
  if (!token?.sub) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const quoteNo = req.nextUrl.searchParams.get("quoteNo");
  if (!quoteNo || quoteNo.trim() === "") {
    return NextResponse.json(
      { error: "quoteNo 파라미터가 필요합니다." },
      { status: 400 }
    );
  }

  let access;
  try {
    access = await assertQuoteAccessByQuoteNo(token, quoteNo);
  } catch (error) {
    if (error instanceof QuoteAccessError) {
      return NextResponse.json(toQuoteAccessResponse(error), {
        status: error.status,
      });
    }
    throw error;
  }

  if (!access) {
    return NextResponse.json({ quote: null, version: null });
  }

  const quote = await db.quote.findUniqueOrThrow({
    where: { id: access.quote.id },
    include: {
      versions: {
        orderBy: { savedAt: "desc" },
        take: 1,
      },
    },
  });

  const latest = quote.versions[0] ?? null;

  return NextResponse.json({
    quote: {
      id: quote.id,
      quoteCode: quote.quoteCode,
      latestVersion: quote.latestVersion,
      role: access.role,
    },
    version: latest
      ? {
          id: latest.id,
          versionNo: latest.versionNo,
          itineraryData: JSON.parse(latest.itineraryData) as ItineraryData,
          quoteData: JSON.parse(latest.quoteData) as QuoteData,
          changeReason: latest.changeReason,
          savedAt: latest.savedAt.toISOString(),
        }
      : null,
  });
}
