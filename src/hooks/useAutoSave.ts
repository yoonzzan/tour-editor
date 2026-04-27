// src/hooks/useAutoSave.ts — T-512
// 30초마다 localStorage에 임시 저장
// 재진입 시 draft 복원 프롬프트

import { useEffect, useRef } from "react";
import { useEditorStore } from "./useEditorStore";
import { KOREA_TIME_ZONE } from "@/lib/date/korea";

const DRAFT_KEY_PREFIX = "draft_";
const INTERVAL_MS = 30_000;

function draftKey(quoteId: string) {
  return `${DRAFT_KEY_PREFIX}${quoteId}`;
}

/** 자동 임시 저장 훅 (30초) */
export function useAutoSave(quoteId: string | null) {
  const { itinerary, quote, isDirty } = useEditorStore();
  const initFromVersion = useEditorStore((s) => s.initFromVersion);
  const hasPrompted = useRef(false);

  // 복원 프롬프트 — 최초 1회
  useEffect(() => {
    if (!quoteId || hasPrompted.current) return;
    hasPrompted.current = true;

    const raw = localStorage.getItem(draftKey(quoteId));
    if (!raw) return;

    try {
      const draft: { itinerary: unknown; quote: unknown; savedAt: string } =
        JSON.parse(raw);

      if (!draft.itinerary || !draft.quote) return;

      const confirmed = window.confirm(
        `저장되지 않은 임시본이 있습니다 (${new Date(draft.savedAt).toLocaleString("ko-KR", {
          timeZone: KOREA_TIME_ZONE,
        })}).\n불러오시겠습니까?`
      );

      if (confirmed) {
        initFromVersion(
          draft.itinerary as import("@/types").ItineraryData,
          draft.quote as import("@/types").QuoteData
        );
      } else {
        localStorage.removeItem(draftKey(quoteId));
      }
    } catch {
      localStorage.removeItem(draftKey(quoteId));
    }
  }, [quoteId, initFromVersion]);

  // 30초 자동 저장
  useEffect(() => {
    if (!quoteId) return;

    const id = setInterval(() => {
      if (!isDirty || !itinerary || !quote) return;
      try {
        localStorage.setItem(
          draftKey(quoteId),
          JSON.stringify({ itinerary, quote, savedAt: new Date().toISOString() })
        );
      } catch {
        // localStorage 용량 초과 등 — 무시
      }
    }, INTERVAL_MS);

    return () => clearInterval(id);
  }, [quoteId, itinerary, quote, isDirty]);

  /** 서버 저장 성공 후 draft 제거 */
  function clearDraft() {
    if (quoteId) localStorage.removeItem(draftKey(quoteId));
  }

  return { clearDraft };
}
