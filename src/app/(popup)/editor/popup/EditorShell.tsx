"use client";

// T-105 usePopupInit 훅 연동
// T-106 견적 없을 때 빈 에디터 + SearchPopup 자동 오픈
// T-107 postMessage (저장 완료 → 부모 창)
// T-108 미저장 닫기 확인 (beforeunload)
// T-402~T-410 견적서 에디터 탭 + 미리보기 모달
// T-508 저장 모달 + 저장 버튼 활성화
// T-509 버전 히스토리 패널
// T-512 자동 임시 저장

import { useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { usePopupInit } from "@/hooks/usePopupInit";
import { useEditorStore } from "@/hooks/useEditorStore";
import { useAutoSave } from "@/hooks/useAutoSave";
import { notifyParent } from "@/lib/postMessage";
import { todayInKorea } from "@/lib/date/korea";
import {
  DEFAULT_EXCHANGE_RATE_ID,
  getQuoteExchangeRates,
  recalculateQuoteData,
} from "@/lib/quote/currency";
import { SearchPopup } from "@/components/editor/SearchPopup";
import { ItineraryEditor } from "@/components/editor/ItineraryEditor";
import { QuoteEditor } from "@/components/editor/QuoteEditor";
import { PreviewModal } from "@/components/editor/PreviewModal";
import { SaveModal } from "@/components/editor/SaveModal";
import { VersionHistory } from "@/components/editor/VersionHistory";
import { FlightPopup } from "@/components/editor/FlightPopup";
import type { Role } from "@/types";
import type { ItineraryData, QuoteData, QuoteItem } from "@/types";
import type { FlightDirection, FlightFareOption, FlightSegment } from "@/app/api/flights/route";

type EditorTab = "itinerary" | "quote";

interface Props {
  quoteNo: string;
  role: Role;
}

interface VersionDetail {
  versionNo: string;
  changeReason: string | null;
  savedAt: string;
  savedByRole: string;
  savedByName: string;
  itineraryData: ItineraryData;
  quoteData: QuoteData;
}

interface FlightSelection {
  schedule: FlightFareOption;
  direction: FlightDirection;
}

function formatFlightSegment(segment: FlightSegment): string {
  return `${segment.airline} ${segment.flightNo} ${segment.depAirport} ${segment.depTime} → ${segment.arrAirport} ${segment.arrTime}`;
}

export function EditorShell({ quoteNo, role }: Props) {
  const { data, isLoading, error } = usePopupInit(quoteNo);
  const { isDirty, itinerary, quote, initFromVersion, markSaved, restoreEditorState, setItinerary, setQuote } =
    useEditorStore();

  const [showSearch, setShowSearch] = useState(false);
  const [activeTab, setActiveTab] = useState<EditorTab>("itinerary");
  const [showPreview, setShowPreview] = useState(false);
  const [showSave, setShowSave] = useState(false);
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [showFlight, setShowFlight] = useState(false);
  const [readonlyVersion, setReadonlyVersion] = useState<VersionDetail | null>(
    null
  );
  const [previewReturnState, setPreviewReturnState] = useState<{
    itinerary: ItineraryData | null;
    quote: QuoteData | null;
    isDirty: boolean;
  } | null>(null);
  const [currentVersion, setCurrentVersion] = useState<string>("v1.0");

  const quoteId = data?.quote?.id ?? null;

  // 초기 데이터 로드 시 currentVersion 동기화
  useEffect(() => {
    if (data?.quote?.latestVersion) {
      setCurrentVersion(data.quote.latestVersion);
    }
  }, [data?.quote?.latestVersion]);

  // 자동 임시 저장 (T-512)
  const { clearDraft } = useAutoSave(quoteId);

  // 기존 버전 데이터가 있으면 스토어 초기화
  useEffect(() => {
    if (data?.version) {
      initFromVersion(data.version.itineraryData, data.version.quoteData);
    }
  }, [data, initFromVersion]);

  // T-106: 견적 없을 때 SearchPopup 자동 오픈
  useEffect(() => {
    if (data && data.quote === null) {
      setShowSearch(true);
    }
  }, [data]);

  // T-108: 미저장 닫기 경고
  useEffect(() => {
    function handleBeforeUnload(e: BeforeUnloadEvent) {
      if (!isDirty) return;
      e.preventDefault();
    }
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  // ── 항공 선택 핸들러 (T-603) ─────────────────────────────
  function handleFlightSelect({ schedule, direction }: FlightSelection) {
    if (!itinerary) return;
    const selectedSegment = formatFlightSegment(schedule.outbound);
    const departure =
      schedule.tripType === "ROUND_TRIP" || direction === "DEPARTURE"
        ? selectedSegment
        : itinerary.basics.flight.departure;
    const arrival =
      schedule.tripType === "ROUND_TRIP"
        ? formatFlightSegment(schedule.inbound)
        : direction === "RETURN"
          ? selectedSegment
          : itinerary.basics.flight.arrival;
    const pax =
      itinerary.overview.passengers.adult + itinerary.overview.passengers.child;
    const quantity = pax > 0 ? pax : 1;
    const fareTypeLabel = schedule.fareType === "GROUP" ? "그룹" : "인디비";
    const tripTypeLabel = schedule.tripType === "ROUND_TRIP" ? "왕복" : "편도";
    const routeLabel =
      schedule.tripType === "ROUND_TRIP"
        ? `${schedule.outbound.depAirport}↔${schedule.outbound.arrAirport}`
        : `${schedule.outbound.depAirport}-${schedule.outbound.arrAirport}`;
    const flightDescription =
      schedule.tripType === "ROUND_TRIP"
        ? `[${fareTypeLabel}/${tripTypeLabel}] ${formatFlightSegment(schedule.outbound)} / ${formatFlightSegment(schedule.inbound)}`
        : `[${fareTypeLabel}/${tripTypeLabel}] ${formatFlightSegment(schedule.outbound)}`;

    setItinerary({
      ...itinerary,
      basics: {
        ...itinerary.basics,
        flight: {
          ...itinerary.basics.flight,
          departure,
          arrival,
        },
      },
    });

    const flightItem: QuoteItem = {
      id: uuidv4(),
      category: "FLIGHT",
      region: routeLabel,
      date: itinerary.overview.travelPeriod.start,
      description: flightDescription,
      quantity,
      unitPrice: schedule.total,
      currencyRateId: DEFAULT_EXCHANGE_RATE_ID,
      subtotal: quantity * schedule.total,
    };
    const currentItems = quote?.items ?? [];
    const groundProfit = quote?.summary.groundProfit ?? 0;
    const agencyFee = quote?.summary.agencyFee ?? 0;
    const items = [flightItem, ...currentItems];

    setQuote(recalculateQuoteData({
      header: quote?.header ?? { writtenAt: todayInKorea() },
      exchangeRates: getQuoteExchangeRates(quote),
      items,
      groundProfit,
      agencyFee,
    }));
    if (schedule.tripType === "ROUND_TRIP") {
      setShowFlight(false);
    }
  }

  // ── 저장 핸들러 ──────────────────────────────────────────
  async function handleSave(changeReason: string) {
    if (!quoteId || !itinerary || !quote) return;

    const res = await fetch(`/api/quotes/${quoteId}/versions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        itineraryData: itinerary,
        quoteData: quote,
        changeReason: changeReason || undefined,
        expectedVersion: currentVersion,
      }),
    });

    if (!res.ok) {
      const body = (await res.json()) as { error?: string; message?: string };
      if (body.error === "VERSION_CONFLICT") {
        throw new Error(
          `버전 충돌이 발생했습니다. 페이지를 새로고침 후 다시 시도해 주세요.\n(${body.message ?? ""})`
        );
      }
      throw new Error(body.message ?? body.error ?? "저장에 실패했습니다.");
    }

    const saved = (await res.json()) as { versionNo: string; savedAt: string };

    markSaved();
    clearDraft();
    setShowSave(false);
    setCurrentVersion(saved.versionNo);

    notifyParent({ type: "SAVE_COMPLETE", quoteNo, versionNo: saved.versionNo });
  }

  // ── 로딩 ─────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-muted-foreground text-sm">데이터를 불러오는 중...</p>
      </div>
    );
  }

  // ── 에러 ─────────────────────────────────────────────
  if (error) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-2">
        <p className="text-destructive text-sm font-medium">
          초기화에 실패했습니다.
        </p>
        <p className="text-muted-foreground text-xs">{error.message}</p>
      </div>
    );
  }

  const isNewQuote = data?.quote === null;
  const hasItinerary = !!itinerary;
  const canEdit = readonlyVersion === null;

  function closeReadonlyPreview() {
    if (previewReturnState) {
      restoreEditorState(
        previewReturnState.itinerary,
        previewReturnState.quote,
        previewReturnState.isDirty
      );
    }
    setPreviewReturnState(null);
    setReadonlyVersion(null);
  }

  // ── 본문 ─────────────────────────────────────────────
  return (
    <div className="flex h-screen flex-col">
      {/* 헤더 */}
      <header className="flex h-12 shrink-0 items-center justify-between border-b border-border bg-card px-4">
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-foreground">
            하나투어 견적·일정 에디터
          </span>
          {!isNewQuote && data?.quote && (
            <span className="rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground">
              {data.quote.quoteCode}
            </span>
          )}
          {!isNewQuote && data?.quote && (
            <span className="rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground">
              {currentVersion}
            </span>
          )}
          <span className="rounded bg-secondary px-2 py-0.5 text-xs text-secondary-foreground">
            {role}
          </span>
          {isDirty && (
            <span className="text-xs text-amber-600">● 저장되지 않음</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* 일정 불러오기 버튼 */}
          <button
            className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted"
            onClick={() => setShowSearch(true)}
          >
            일정 불러오기
          </button>

          {/* 항공 조회 버튼 (T-605: partner 숨김) */}
          {role !== "PARTNER" && (
            <button
              className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted"
              onClick={() => setShowFlight(true)}
            >
              항공 조회
            </button>
          )}

          {/* 버전 이력 버튼 */}
          {quoteId && (
            <button
              className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted"
              onClick={() => setShowVersionHistory(true)}
            >
              버전 이력
            </button>
          )}

          {/* 미리보기 버튼 */}
          {hasItinerary && (
            <button
              className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted"
              onClick={() => setShowPreview(true)}
            >
              미리보기
            </button>
          )}

          {/* 저장 버튼 */}
          {canEdit && (
            <button
              className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
              disabled={!isDirty || !quoteId || !hasItinerary}
              onClick={() => setShowSave(true)}
            >
              저장
            </button>
          )}

          {/* 닫기 */}
          <button
            className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted"
            onClick={() => {
              if (
                isDirty &&
                !window.confirm(
                  "저장하지 않은 변경이 있습니다. 닫으시겠습니까?"
                )
              ) {
                return;
              }
              notifyParent({ type: "EDITOR_CLOSED" });
              window.close();
            }}
          >
            닫기
          </button>
        </div>
      </header>

      {/* 탭 바 */}
      {hasItinerary && (
        <div className="flex shrink-0 justify-center border-b border-border bg-card">
          <div className="flex">
            <TabButton
              active={activeTab === "itinerary"}
              onClick={() => setActiveTab("itinerary")}
              label="일정표"
            />
            <TabButton
              active={activeTab === "quote"}
              onClick={() => setActiveTab("quote")}
              label="견적서"
            />
          </div>
        </div>
      )}

      {/* 구버전 읽기 전용 배너 (T-510) */}
      {readonlyVersion && (
        <div className="flex shrink-0 items-center justify-between bg-amber-50 px-4 py-2 text-xs text-amber-700">
          <span>
            읽기 전용 미리보기 — {readonlyVersion.versionNo} (
            {readonlyVersion.savedByName})
          </span>
          <button
            onClick={closeReadonlyPreview}
            className="font-medium underline"
          >
            닫기
          </button>
        </div>
      )}

      {/* 본문 — 탭별 CSS hidden으로 마운트 유지 */}
      <main className={`flex-1 overflow-auto${!canEdit ? " pointer-events-none select-none opacity-75" : ""}`}>
        {hasItinerary ? (
          <>
            <div
              className={`h-full p-4 ${activeTab === "itinerary" ? "" : "hidden"}`}
            >
              <ItineraryEditor />
            </div>
            <div
              className={`h-full p-4 ${activeTab === "quote" ? "" : "hidden"}`}
            >
              <QuoteEditor role={role} />
            </div>
          </>
        ) : isNewQuote ? (
          <div className="flex h-full flex-col items-center justify-center gap-3">
            <p className="text-sm text-muted-foreground">
              연결된 견적이 없습니다.
            </p>
            <button
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
              onClick={() => setShowSearch(true)}
            >
              일정 불러오기
            </button>
          </div>
        ) : (
          <div className="flex h-full items-center justify-center">
            <p className="text-sm text-muted-foreground">
              일정 데이터를 초기화하는 중...
            </p>
          </div>
        )}
      </main>

      {/* SearchPopup 모달 */}
      {showSearch && <SearchPopup onClose={() => setShowSearch(false)} />}

      {/* 항공 조회 모달 (T-603) */}
      {showFlight && (
        <FlightPopup
          onClose={() => setShowFlight(false)}
          onSelect={handleFlightSelect}
        />
      )}

      {/* 미리보기 모달 (T-410) */}
      {showPreview && <PreviewModal quoteId={quoteId} onClose={() => setShowPreview(false)} />}

      {/* 저장 모달 (T-508) */}
      {showSave && (
        <SaveModal onSave={handleSave} onClose={() => setShowSave(false)} />
      )}

      {/* 버전 이력 패널 (T-509) */}
      {showVersionHistory && quoteId && (
        <VersionHistory
          quoteId={quoteId}
          latestVersion={currentVersion}
          onClose={() => setShowVersionHistory(false)}
          onPreviewVersion={(v) => {
            setPreviewReturnState({ itinerary, quote, isDirty });
            initFromVersion(v.itineraryData, v.quoteData);
            setReadonlyVersion(v);
            setShowVersionHistory(false);
          }}
        />
      )}
    </div>
  );
}

// ── 탭 버튼 ────────────────────────────────────────────────
function TabButton({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`border-b-2 px-4 py-2.5 text-xs font-medium transition-colors ${
        active
          ? "border-primary text-primary"
          : "border-transparent text-muted-foreground hover:text-foreground"
      }`}
    >
      {label}
    </button>
  );
}
