// src/lib/version/generateVersionNo.ts — T-501
// 버전 채번: "v1.0" → "v1.1" → ... → "v1.9" → "v1.10"
// 규칙: minor만 증가, major 는 0 고정 (1차 MVP)

/**
 * 현재 최신 버전 문자열을 받아 다음 버전 문자열을 반환한다.
 * @param latestVersionNo "v1.0" 형태의 버전 문자열
 * @returns "v1.1" 형태의 다음 버전 문자열
 * @throws 버전 형식이 유효하지 않은 경우
 */
export function generateVersionNo(latestVersionNo: string): string {
  const match = latestVersionNo.match(/^v(\d+)\.(\d+)$/);
  if (!match) {
    throw new Error(`유효하지 않은 버전 형식: "${latestVersionNo}"`);
  }
  const major = parseInt(match[1], 10);
  const minor = parseInt(match[2], 10);
  return `v${major}.${minor + 1}`;
}

/** 첫 버전 문자열 상수 */
export const INITIAL_VERSION = "v1.0";
