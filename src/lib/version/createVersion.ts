// src/lib/version/createVersion.ts — T-502
// INSERT-only 버전 생성 + 낙관적 잠금
// 절대 UPDATE 금지 — @@unique([quoteId, versionNo])로 DB 레벨 보장

import { db } from "@/lib/db";
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

  // 1. 낙관적 잠금 — 현재 DB 상태 확인
  const quote = await db.quote.findUnique({
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
  const existingVersionCount = await db.quoteVersion.count({
    where: { quoteId },
  });

  const newVersionNo =
    existingVersionCount === 0
      ? INITIAL_VERSION
      : generateVersionNo(quote.latestVersion);

  // 3. QuoteVersion INSERT
  const version = await db.quoteVersion.create({
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

  // 4. Quote.latestVersion UPDATE (유일하게 허용된 UPDATE)
  await db.quote.update({
    where: { id: quoteId },
    data: { latestVersion: newVersionNo },
  });

  return version;
}
