// src/app/api/quotes/[id]/versions/diff/route.ts — T-507
// ?from=v1.0&to=v1.1 두 버전 간 diff 계산

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { diffVersions } from "@/lib/version/diffVersions";
import type { QuoteData } from "@/types";
import { getApiToken } from "@/lib/auth";
import {
  assertQuoteAccessByQuoteId,
  QuoteAccessError,
  toQuoteAccessResponse,
} from "@/lib/auth/quoteAccess";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = await getApiToken(req);
  if (!token?.sub) {
    return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
  }

  const { id } = await params;
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

  const { searchParams } = req.nextUrl;
  const fromVersion = searchParams.get("from");
  const toVersion = searchParams.get("to");

  if (!fromVersion || !toVersion) {
    return NextResponse.json(
      { error: "from, to 쿼리 파라미터가 필요합니다." },
      { status: 400 }
    );
  }

  const [fromRecord, toRecord] = await Promise.all([
    db.quoteVersion.findUnique({
      where: { quoteId_versionNo: { quoteId: id, versionNo: fromVersion } },
      select: { quoteData: true },
    }),
    db.quoteVersion.findUnique({
      where: { quoteId_versionNo: { quoteId: id, versionNo: toVersion } },
      select: { quoteData: true },
    }),
  ]);

  if (!fromRecord) {
    return NextResponse.json(
      { error: `버전을 찾을 수 없습니다: ${fromVersion}` },
      { status: 404 }
    );
  }
  if (!toRecord) {
    return NextResponse.json(
      { error: `버전을 찾을 수 없습니다: ${toVersion}` },
      { status: 404 }
    );
  }

  const fromData = JSON.parse(fromRecord.quoteData) as QuoteData;
  const toData = JSON.parse(toRecord.quoteData) as QuoteData;

  const diff = diffVersions(fromData, toData);

  return NextResponse.json({ from: fromVersion, to: toVersion, diff });
}
