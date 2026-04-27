// src/app/api/quotes/[id]/versions/route.ts — T-504, T-505

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { createVersion, VersionConflictError } from "@/lib/version/createVersion";
import type { ItineraryData, QuoteData, Role } from "@/types";
import { getApiToken } from "@/lib/auth";
import {
  assertQuoteAccessByQuoteId,
  QuoteAccessError,
  toQuoteAccessResponse,
} from "@/lib/auth/quoteAccess";

// ── GET /api/quotes/[id]/versions — T-505: 버전 목록 ───────────────
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

  const versions = await db.quoteVersion.findMany({
    where: { quoteId: id },
    orderBy: { savedAt: "desc" },
    select: {
      id: true,
      versionNo: true,
      changeReason: true,
      savedAt: true,
      savedByRole: true,
      savedBy: { select: { name: true } },
    },
  });

  return NextResponse.json({ versions });
}

// ── POST /api/quotes/[id]/versions — T-504: 버전 생성 ──────────────
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

  let body: {
    itineraryData: ItineraryData;
    quoteData: QuoteData;
    changeReason?: string;
    expectedVersion: string;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청 형식입니다." }, { status: 400 });
  }

  if (!body.itineraryData || !body.quoteData || !body.expectedVersion) {
    return NextResponse.json(
      { error: "itineraryData, quoteData, expectedVersion은 필수입니다." },
      { status: 400 }
    );
  }

  try {
    const version = await createVersion({
      quoteId: id,
      itineraryData: body.itineraryData,
      quoteData: body.quoteData,
      savedById: token.sub,
      savedByRole: token.role as Role,
      changeReason: body.changeReason,
      expectedVersion: body.expectedVersion,
    });

    return NextResponse.json(
      { versionNo: version.versionNo, savedAt: version.savedAt },
      { status: 201 }
    );
  } catch (err) {
    if (err instanceof VersionConflictError) {
      return NextResponse.json(
        {
          error: "VERSION_CONFLICT",
          message: err.message,
          current: err.current,
        },
        { status: 409 }
      );
    }
    if (err instanceof Error && err.message.includes("찾을 수 없습니다")) {
      return NextResponse.json({ error: err.message }, { status: 404 });
    }
    // eslint-disable-next-line no-console -- 서버 에러 로깅 필수
    console.error("[POST /api/quotes/[id]/versions]", err);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}
