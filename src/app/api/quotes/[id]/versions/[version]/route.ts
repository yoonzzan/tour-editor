// src/app/api/quotes/[id]/versions/[version]/route.ts — T-506
// 특정 버전 조회

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { db } from "@/lib/db";
import type { ItineraryData, QuoteData } from "@/types";
import { getApiToken } from "@/lib/auth";
import {
  assertQuoteAccessByQuoteId,
  QuoteAccessError,
  toQuoteAccessResponse,
} from "@/lib/auth/quoteAccess";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; version: string }> }
) {
  const token = await getApiToken(req);
  if (!token?.sub) {
    return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
  }

  const { id, version } = await params;
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

  const record = await db.quoteVersion.findUnique({
    where: { quoteId_versionNo: { quoteId: id, versionNo: version } },
    select: {
      id: true,
      versionNo: true,
      changeReason: true,
      savedAt: true,
      savedByRole: true,
      itineraryData: true,
      quoteData: true,
      savedBy: { select: { name: true } },
    },
  });

  if (!record) {
    return NextResponse.json(
      { error: `버전을 찾을 수 없습니다: ${version}` },
      { status: 404 }
    );
  }

  return NextResponse.json({
    id: record.id,
    versionNo: record.versionNo,
    changeReason: record.changeReason,
    savedAt: record.savedAt,
    savedByRole: record.savedByRole,
    savedByName: record.savedBy.name,
    itineraryData: JSON.parse(record.itineraryData) as ItineraryData,
    quoteData: JSON.parse(record.quoteData) as QuoteData,
  });
}
