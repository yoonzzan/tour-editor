// src/hooks/usePopupInit.ts — 팝업 초기 데이터 로드 훅
import { useQuery } from "@tanstack/react-query";
import type { ItineraryData, QuoteData, Role } from "@/types";

export interface QuoteMeta {
  id: string;
  quoteCode: string;
  latestVersion: string;
  role: Role;
}

export interface VersionMeta {
  id: string;
  versionNo: string;
  itineraryData: ItineraryData;
  quoteData: QuoteData;
  changeReason: string | null;
  savedAt: string;
}

export interface PopupInitData {
  quote: QuoteMeta | null;
  version: VersionMeta | null;
}

async function fetchInit(quoteNo: string): Promise<PopupInitData> {
  const res = await fetch(
    `/api/editor/init?quoteNo=${encodeURIComponent(quoteNo)}`
  );
  if (!res.ok) {
    const body = (await res.json()) as { error?: string };
    throw new Error(body.error ?? "초기화 데이터 로드에 실패했습니다.");
  }
  return res.json() as Promise<PopupInitData>;
}

export function usePopupInit(quoteNo: string) {
  return useQuery<PopupInitData, Error>({
    queryKey: ["popup-init", quoteNo],
    queryFn: () => fetchInit(quoteNo),
    staleTime: Infinity, // 팝업 세션 동안 재조회 없음
  });
}
