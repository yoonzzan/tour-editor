// src/lib/version/createVersion.ts — T-502
// INSERT-only 버전 생성 + 낙관적 잠금
// 절대 UPDATE 금지 — @@unique([quoteId, versionNo])로 DB 레벨 보장

import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";
import type { ItineraryData, QuoteData, Role } from "@/types";
import { generateVersionNo, INITIAL_VERSION } from "./generateVersionNo";

export class VersionConflictError extends Error {
  readonly code = "VERSION_CONFLICT";
  constructor(
    public readonly current: string,
    public readonly expected: string
  ) {
    super(
      `버전 충돌: 현재 최신 버전은 ${current}이며, 요청한 ${expected}와 다릅니다.`
    );
    this.name = "VersionConflictError";
  }
}

interface CreateVersionInput {
  quoteId: string;
  itineraryData: ItineraryData;
  quoteData: QuoteData;
  savedById: string;
  savedByRole: Role;
  changeReason?: string;
  /** 낙관적 잠금: 클라이언트가 알고 있는 현재 최신 버전 */
  expectedVersion: string;
}

interface CreatedVersion {
  id: string;
  versionNo: string;
  savedAt: Date;
}

function isUniqueConstraintError(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

/**
 * T-502: 새 버전을 INSERT한다. UPDATE는 절대 하지 않는다.
 *
 * 낙관적 잠금:
 *   - expectedVersion === DB의 latestVersion → 정상 진행
 *   - 불일치 → VersionConflictError (409)
 *
 * 첫 저장(latestVersion = "v1.0", 아직 버전 없음):
 *   - expectedVersion = "v1.0"일 때 versionNo = "v1.0"으로 생성
 */
export async function createVersion(
  input: CreateVersionInput
): Promise<CreatedVersion> {
  const {
    quoteId,
    itineraryData,
    quoteData,
    savedById,
    savedByRole,
    changeReason,
    expectedVersion,
  } = input;

  try {
    return await db.$transaction(async (tx) => {
      // 1. 낙관적 잠금 — 현재 DB 상태 확인
      const quote = await tx.quote.findUnique({
        where: { id: quoteId },
        select: { latestVersion: true },
      });

      if (!quote) {
        throw new Error(`견적을 찾을 수 없습니다: ${quoteId}`);
      }

      if (quote.latestVersion !== expectedVersion) {
        throw new VersionConflictError(quote.latestVersion, expectedVersion);
      }

      // 2. 새 버전 번호 결정
      //    - DB에 아직 버전이 없으면 INITIAL_VERSION(v1.0)
      //    - 이미 있으면 latestVersion + 0.1
      const existingVersionCount = await tx.quoteVersion.count({
        where: { quoteId },
      });

      const newVersionNo =
        existingVersionCount === 0
          ? INITIAL_VERSION
          : generateVersionNo(quote.latestVersion);

      // 3. Quote.latestVersion을 조건부로 선점한다.
      //    동시에 저장된 요청은 여기서 409 충돌로 매핑된다.
      const claimed = await tx.quote.updateMany({
        where: { id: quoteId, latestVersion: expectedVersion },
        data: { latestVersion: newVersionNo },
      });

      if (claimed.count !== 1) {
        const current = await tx.quote.findUnique({
          where: { id: quoteId },
          select: { latestVersion: true },
        });
        throw new VersionConflictError(current?.latestVersion ?? expectedVersion, expectedVersion);
      }

      // 4. QuoteVersion INSERT
      return tx.quoteVersion.create({
        data: {
          versionNo: newVersionNo,
          changeReason: changeReason ?? null,
          itineraryData: JSON.stringify(itineraryData),
          quoteData: JSON.stringify(quoteData),
          quoteId,
          savedById,
          savedByRole,
        },
        select: { id: true, versionNo: true, savedAt: true },
      });
    });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      const current = await db.quote.findUnique({
        where: { id: quoteId },
        select: { latestVersion: true },
      });
      throw new VersionConflictError(current?.latestVersion ?? expectedVersion, expectedVersion);
    }
    throw error;
  }
}
