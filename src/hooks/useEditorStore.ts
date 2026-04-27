// src/hooks/useEditorStore.ts — 에디터 전역 상태 (Zustand)
import { create } from "zustand";
import type { ItineraryData, QuoteData } from "@/types";
import { enforceAccommodationPolicy } from "@/lib/itinerary/policy";

interface EditorState {
  /** 현재 편집 중인 일정표 데이터 (null = 미로드) */
  itinerary: ItineraryData | null;
  /** 현재 편집 중인 견적서 데이터 (null = 미로드) */
  quote: QuoteData | null;
  /** 미저장 변경 여부 */
  isDirty: boolean;

  // ── 액션 ───────────────────────────────────────────────

  /** SearchPopup에서 상품 선택 후 에디터 전체 교체 */
  loadFromProduct: (itinerary: ItineraryData) => void;
  /** 일정표 데이터 업데이트 */
  setItinerary: (itinerary: ItineraryData) => void;
  /** 견적서 데이터 업데이트 */
  setQuote: (quote: QuoteData) => void;
  /** 저장 완료 후 dirty 초기화 */
  markSaved: () => void;
  /** 기존 버전 데이터로 초기화 */
  initFromVersion: (itinerary: ItineraryData, quote: QuoteData) => void;
  /** 읽기 전용 버전 미리보기 종료 후 이전 편집 상태 복원 */
  restoreEditorState: (itinerary: ItineraryData | null, quote: QuoteData | null, isDirty: boolean) => void;
}

export const useEditorStore = create<EditorState>((set) => ({
  itinerary: null,
  quote: null,
  isDirty: false,

  loadFromProduct: (itinerary) =>
    set({ itinerary: enforceAccommodationPolicy(itinerary), quote: null, isDirty: false }),

  setItinerary: (itinerary) =>
    set({ itinerary, isDirty: true }),

  setQuote: (quote) =>
    set({ quote, isDirty: true }),

  markSaved: () =>
    set({ isDirty: false }),

  initFromVersion: (itinerary, quote) =>
    set({ itinerary, quote, isDirty: false }),

  restoreEditorState: (itinerary, quote, isDirty) =>
    set({ itinerary, quote, isDirty }),
}));
