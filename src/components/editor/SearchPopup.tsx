"use client";

// T-201: SearchPopup 껍데기 + 탭 구조 (상품코드 / 파일첨부 / 직접입력)
// T-202: 상품코드 입력 UI
// T-205: 조회 결과 미리보기 패널
// T-206: "이 일정으로 시작" → useEditorStore
// T-207: 파일 첨부 탭 UI
// T-208: 직접 입력 탭 UI

import { useState, useRef, type DragEvent, type ChangeEvent } from "react";
import type { ItineraryData, ScheduleItem } from "@/types";
import { useEditorStore } from "@/hooks/useEditorStore";
import { alignDaysToTravelPeriod } from "@/lib/itinerary/dayAlignment";
import { mergeScheduleContent } from "@/lib/itinerary/contentDetail";
import { getMealSlotRows } from "@/lib/itinerary/meal";

type Tab = "code" | "file" | "direct";

interface SearchResult {
  code: string;
  name: string;
  itinerary: ItineraryData;
  _meta?: {
    source?: "mock" | "mcp" | "mock-fallback";
    requestedCode?: string;
    matchedCode?: string;
    requestGuid?: string;
    useMockEnabled?: boolean;
  };
}

interface Props {
  onClose: () => void;
}

interface ParseApiResponse {
  itinerary?: ItineraryData;
  diagnostics?: {
    source?: "ai" | "fallback-tabular" | "fallback-no-key" | "fallback-ai-error" | "fallback-quality";
    aiAttempted?: boolean;
    aiError?: string;
    aiMeaningfulItemCount?: number;
    fallbackMeaningfulItemCount?: number;
    expectedMinimumItemCount?: number;
  };
  error?: string;
}

function parserDiagnosticMessage(diagnostics: ParseApiResponse["diagnostics"]): string | null {
  if (!diagnostics || diagnostics.source === "ai" || diagnostics.source === "fallback-tabular") return null;
  if (diagnostics.source === "fallback-no-key") {
    return "AI API key가 서버에 반영되지 않아 기본 파서로 불러왔습니다. dev 서버를 재시작하고 .env.local의 OPENAI_API_KEY를 확인해 주세요.";
  }
  if (diagnostics.source === "fallback-ai-error") {
    return `AI 호출이 실패해서 기본 파서로 불러왔습니다.${diagnostics.aiError ? `\n\n원인: ${diagnostics.aiError}` : ""}`;
  }
  if (diagnostics.source === "fallback-quality") {
    return [
      "AI 결과가 품질 기준을 통과하지 못해 기본 파서로 불러왔습니다.",
      `AI 항목 수: ${diagnostics.aiMeaningfulItemCount ?? 0}`,
      `기본 파서 항목 수: ${diagnostics.fallbackMeaningfulItemCount ?? 0}`,
      `최소 기대 항목 수: ${diagnostics.expectedMinimumItemCount ?? 0}`,
    ].join("\n");
  }
  return null;
}

function formatItemForEditableText(item: ScheduleItem): string {
  if (item.type === "MEAL") {
    const meals = getMealSlotRows(item, { includeEmpty: false });
    if (meals.length > 0) {
      return meals.map(({ label, value }) => `식사 | ${label}: ${value}`).join("\n");
    }
    return `식사 | ${item.content}`;
  }

  const labels: Record<ScheduleItem["type"], string> = {
    TRANSFER: "이동",
    SIGHTSEEING: "관광",
    MEAL: "식사",
    ACCOMMODATION: "숙박",
    OTHER: "기타",
  };
  const content = mergeScheduleContent(item.content, item.detail);
  const meta = [labels[item.type], item.time ? `시간=${item.time}` : ""].filter(Boolean);

  return `${meta.join(" | ")} | ${content}`;
}

function compactPreviewValue(value: string, max = 520): string {
  const normalized = value.replace(/\s*\|\s*/gu, " | ").replace(/\s+/gu, " ").trim();
  if (!normalized || normalized.length <= max) return normalized;
  return `${normalized.slice(0, max).trim()}...`;
}

function itineraryToEditableText(itinerary: ItineraryData): string {
  const basics = itinerary.basics;
  const fare = itinerary.overview.fare;
  const lines = [
    `상품명: ${itinerary.header.groupName}`,
    `도시: ${itinerary.overview.cities}`,
    `기간: ${itinerary.overview.travelPeriod.start} ~ ${itinerary.overview.travelPeriod.end}`,
    fare.adultPerPerson > 0 ? `여행요금: ${fare.adultPerPerson.toLocaleString("ko-KR")}원` : "",
    basics.flight.departure ? `항공 출발: ${basics.flight.departure}` : "",
    basics.flight.arrival ? `항공 귀국: ${basics.flight.arrival}` : "",
    basics.flight.localVehicle ? `차량: ${basics.flight.localVehicle}` : "",
    basics.accommodation.hotel ? `숙박호텔: ${basics.accommodation.hotel}` : "",
    basics.accommodation.grade ? `호텔등급: ${basics.accommodation.grade}` : "",
    basics.accommodation.occupancy ? `1객실이용인원: ${basics.accommodation.occupancy}` : "",
    basics.included ? `포함사항: ${basics.included}` : "",
    basics.excluded ? `불포함사항: ${basics.excluded}` : "",
    basics.optionalTour ? `선택관광: ${basics.optionalTour}` : "",
    `쇼핑센터 방문 수: ${basics.shoppingCenters}`,
    basics.notes ? `유의사항: ${compactPreviewValue(basics.notes)}` : "",
    "",
  ].filter((line) => line !== "");

  for (const day of itinerary.days) {
    lines.push(`${day.dayNo}일차 ${day.date}`);
    for (const item of day.items) {
      lines.push(`- ${formatItemForEditableText(item)}`);
    }
    lines.push("");
  }

  return lines.join("\n").trim();
}

function importAlignmentMessage(expectedDayCount: number, outOfRangeDayNos: number[]): string {
  return [
    `여행기간은 ${expectedDayCount}일인데 ${outOfRangeDayNos.join(", ")}일차에 내용이 있습니다.`,
    "여행기간과 일차수가 다릅니다. 그대로 입력할까요?",
  ].join("\n");
}

const FOOTER_PRIMARY_BUTTON_CLASS =
  "w-32 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50";
const FOOTER_SECONDARY_BUTTON_CLASS =
  "w-32 rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted";

export function SearchPopup({ onClose }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("code");
  const loadFromProduct = useEditorStore((s) => s.loadFromProduct);

  // ── 상품코드 탭 상태 ──────────────────────────────────
  const [codeInput, setCodeInput] = useState("");
  const [codeLoading, setCodeLoading] = useState(false);
  const [codeError, setCodeError] = useState<string | null>(null);
  const [searchResult, setSearchResult] = useState<SearchResult | null>(null);
  const [previewProductText, setPreviewProductText] = useState("");

  // ── 파일 탭 상태 ─────────────────────────────────────
  const [isDragging, setIsDragging] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileLoading, setFileLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── 직접 입력 탭 상태 ─────────────────────────────────
  const [directText, setDirectText] = useState("");
  const [directLoading, setDirectLoading] = useState(false);
  const [directError, setDirectError] = useState<string | null>(null);

  // ── 상품코드 조회 ─────────────────────────────────────
  async function handleSearch() {
    const code = codeInput.trim().toUpperCase();
    if (!code) return;

    setCodeLoading(true);
    setCodeError(null);
    setSearchResult(null);

    try {
      const res = await fetch(`/api/mcp/products/${encodeURIComponent(code)}`);
      const raw = await res.text();

      if (!res.ok) {
        try {
          const body = JSON.parse(raw) as { error?: string };
          setCodeError(body.error ?? `조회에 실패했습니다. (${res.status})`);
        } catch {
          setCodeError(raw || `조회에 실패했습니다. (${res.status})`);
        }
        return;
      }
      const body = JSON.parse(raw) as SearchResult;
      const aligned = alignDaysToTravelPeriod(body.itinerary).itinerary;
      setSearchResult({ ...body, itinerary: aligned });
      setPreviewProductText(itineraryToEditableText(aligned));
    } catch {
      setCodeError("네트워크 오류가 발생했습니다. 다시 시도해 주세요.");
    } finally {
      setCodeLoading(false);
    }
  }

  function handleLoadProduct() {
    if (!searchResult) return;
    const aligned = alignDaysToTravelPeriod(searchResult.itinerary);
    if (
      aligned.hasOutOfRangeContent &&
      aligned.expectedDayCount &&
      !window.confirm(importAlignmentMessage(aligned.expectedDayCount, aligned.outOfRangeDayNos))
    ) {
      return;
    }
    loadFromProduct(aligned.itinerary);
    onClose();
  }

  async function handleCopyPreviewText() {
    if (!previewProductText.trim()) return;
    await navigator.clipboard.writeText(previewProductText);
  }

  function handleUseDirectInput() {
    setDirectText(previewProductText);
    setActiveTab("direct");
  }

  // ── 파일 유효성 검사 ──────────────────────────────────
  function validateFile(file: File): string | null {
    const MAX_MB = 10;
    const name = file.name.toLowerCase();
    if (file.size > MAX_MB * 1024 * 1024) {
      return `파일 크기가 ${MAX_MB}MB를 초과합니다. (${(file.size / 1024 / 1024).toFixed(1)}MB)`;
    }
    if (name.endsWith(".xls") && !name.endsWith(".xlsx")) {
      return "구형 Excel(.xls)은 지원하지 않습니다. Excel에서 .xlsx로 저장한 뒤 업로드해 주세요.";
    }
    if (name.endsWith(".hwp") && !name.endsWith(".hwpx")) {
      return "구형 한글(.hwp)은 아직 지원하지 않습니다. .hwpx 또는 PDF로 저장한 뒤 업로드해 주세요.";
    }
    return null;
  }

  function handleFileDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (!file) return;
    const err = validateFile(file);
    if (err) { setFileError(err); setFileName(null); setSelectedFile(null); return; }
    setFileError(null);
    setFileName(file.name);
    setSelectedFile(file);
  }

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const err = validateFile(file);
    if (err) { setFileError(err); setFileName(null); setSelectedFile(null); return; }
    setFileError(null);
    setFileName(file.name);
    setSelectedFile(file);
  }

  async function handleParseFile() {
    if (!selectedFile) {
      setFileError("파일을 먼저 선택해 주세요.");
      return;
    }

    setFileLoading(true);
    setFileError(null);
    try {
      const form = new FormData();
      form.append("file", selectedFile);
      form.append("title", selectedFile.name.replace(/\.[^.]+$/u, ""));

      const response = await fetch("/api/itinerary/parse", {
        method: "POST",
        body: form,
      });
      const payload = (await response.json()) as ParseApiResponse;
      if (!response.ok || !payload.itinerary) {
        throw new Error(payload.error ?? "파일에서 일정을 불러오지 못했습니다.");
      }
      const parsed = payload.itinerary;
      if (!parsed.days || parsed.days.length === 0) {
        throw new Error("불러올 수 있는 일정이 없습니다.");
      }
      const aligned = alignDaysToTravelPeriod(parsed);
      if (
        aligned.hasOutOfRangeContent &&
        aligned.expectedDayCount &&
        !window.confirm(importAlignmentMessage(aligned.expectedDayCount, aligned.outOfRangeDayNos))
      ) {
        return;
      }
      const diagnosticMessage = parserDiagnosticMessage(payload.diagnostics);
      if (diagnosticMessage) window.alert(diagnosticMessage);
      loadFromProduct(aligned.itinerary);
      onClose();
    } catch (error) {
      const message = error instanceof Error ? error.message : "파일에서 일정을 불러오지 못했습니다. 형식을 확인해 주세요.";
      setFileError(message);
    } finally {
      setFileLoading(false);
    }
  }

  async function handleParseDirectInput() {
    if (!directText.trim()) {
      setDirectError("직접 입력 내용을 입력해 주세요.");
      return;
    }

    setDirectLoading(true);
    setDirectError(null);
    try {
      const form = new FormData();
      form.append("text", directText);
      form.append("title", "직접입력 일정");
      const response = await fetch("/api/itinerary/parse", {
        method: "POST",
        body: form,
      });
      const payload = (await response.json()) as ParseApiResponse;
      if (!response.ok || !payload.itinerary) {
        throw new Error(payload.error ?? "입력한 내용에서 일정을 불러오지 못했습니다.");
      }
      const parsed = payload.itinerary;
      if (!parsed.days || parsed.days.length === 0) {
        throw new Error("불러올 수 있는 일정이 없습니다.");
      }
      const aligned = alignDaysToTravelPeriod(parsed);
      if (
        aligned.hasOutOfRangeContent &&
        aligned.expectedDayCount &&
        !window.confirm(importAlignmentMessage(aligned.expectedDayCount, aligned.outOfRangeDayNos))
      ) {
        return;
      }
      const diagnosticMessage = parserDiagnosticMessage(payload.diagnostics);
      if (diagnosticMessage) window.alert(diagnosticMessage);
      loadFromProduct(aligned.itinerary);
      onClose();
    } catch (error) {
      const message = error instanceof Error ? error.message : "입력한 내용에서 일정을 불러오지 못했습니다. 형식을 확인해 주세요.";
      setDirectError(message);
    } finally {
      setDirectLoading(false);
    }
  }

  // ── 렌더 ─────────────────────────────────────────────
  return (
    /* 오버레이 */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="flex w-[640px] flex-col rounded-lg border border-border bg-background shadow-lg">
        {/* 헤더 */}
        <div className="flex h-12 items-center justify-between border-b border-border px-4">
          <h2 className="text-sm font-semibold text-foreground">일정 불러오기</h2>
          <button
            aria-label="닫기"
            className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        {/* 탭 바 */}
        <div className="flex border-b border-border">
          {(
            [
              { key: "code", label: "상품코드 조회" },
              { key: "file", label: "파일 첨부" },
              { key: "direct", label: "직접 입력" },
            ] as { key: Tab; label: string }[]
          ).map(({ key, label }) => (
            <button
              key={key}
              className={`px-4 py-2.5 text-sm font-medium transition-colors ${
                activeTab === key
                  ? "border-b-2 border-primary text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              onClick={() => setActiveTab(key)}
            >
              {label}
            </button>
          ))}
        </div>

        {/* 탭 콘텐츠 */}
        <div className="flex-1 p-4">
          {/* ── 상품코드 탭 ── */}
          {activeTab === "code" && (
            <div className="flex flex-col gap-4">
              <div className="flex gap-2">
                <label htmlFor="product-code" className="sr-only">
                  상품코드
                </label>
                <input
                  id="product-code"
                  type="text"
                  placeholder="상품코드 입력 (예: AVP999261231VNE)"
                  value={codeInput}
                  onChange={(e) => setCodeInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") void handleSearch(); }}
                  className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <button
                  onClick={() => void handleSearch()}
                  disabled={codeLoading || !codeInput.trim()}
                  className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
                >
                  {codeLoading ? "조회 중..." : "조회"}
                </button>
              </div>

              {/* 에러 */}
              {codeError && (
                <p role="alert" className="text-sm text-destructive">
                  {codeError}
                </p>
              )}

              {/* 조회 결과 편집 */}
              {searchResult && (
                <div className="rounded-md border border-border bg-muted/40 p-4">
                  <div className="mb-3 rounded-md border border-primary/30 bg-primary/10 p-3">
                    <p className="text-xs font-semibold text-foreground">
                      조회된 일정은 바로 입력됩니다.
                    </p>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">
                      일부 문구만 수정하려면 아래 요약을 복사하거나 직접 입력 탭으로 보내서 수정한 뒤 불러오세요.
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => void handleCopyPreviewText()}
                        className="rounded-md border border-border bg-background px-2 py-1 text-[11px] font-medium text-foreground hover:bg-muted"
                      >
                        요약 복사
                      </button>
                      <button
                        type="button"
                        onClick={handleUseDirectInput}
                        className="rounded-md border border-border bg-background px-2 py-1 text-[11px] font-medium text-foreground hover:bg-muted"
                      >
                        직접 입력에서 수정
                      </button>
                    </div>
                  </div>
                  <div className="mb-3 flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        {searchResult.name}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1 border-t border-border pt-3">
                    <label htmlFor="product-edit-text" className="text-xs font-medium text-foreground">
                      조회된 일정 요약
                    </label>
                    <textarea
                      id="product-edit-text"
                      value={previewProductText}
                      readOnly
                      rows={10}
                      className="w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-xs leading-5 text-foreground focus:outline-none"
                    />
                    <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                      <span>상품코드: {searchResult.code}</span>
                      <span>데이터 소스: {searchResult._meta?.source ?? "unknown"}</span>
                      {searchResult._meta?.requestGuid && (
                        <span>요청 GUID: {searchResult._meta.requestGuid}</span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── 파일 첨부 탭 (T-207) ── */}
          {activeTab === "file" && (
            <div className="flex flex-col gap-4">
              <div
                role="region"
                aria-label="파일 드롭 영역"
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleFileDrop}
                className={`flex min-h-[160px] cursor-pointer flex-col items-center justify-center gap-3 rounded-md border-2 border-dashed transition-colors ${
                  isDragging
                    ? "border-primary bg-primary/5"
                    : "border-border bg-muted/20 hover:border-muted-foreground/50"
                }`}
                onClick={() => fileInputRef.current?.click()}
              >
                <span className="text-2xl select-none">📎</span>
                <p className="text-sm text-muted-foreground">
                  파일을 여기에 드래그하거나 클릭하여 선택하세요
                </p>
                <p className="text-xs text-muted-foreground">최대 10MB</p>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.csv,.json,.txt,.pdf,.hwpx"
                className="hidden"
                aria-label="파일 선택"
                onChange={handleFileChange}
              />

              {fileError && (
                <p role="alert" className="text-sm text-destructive">
                  {fileError}
                </p>
              )}

              {fileName && (
                <div className="rounded-md border border-border bg-muted/40 px-3 py-2">
                  <p className="truncate text-sm text-foreground">{fileName}</p>
                </div>
              )}

              {!fileName && !fileError && (
                <p className="text-xs text-muted-foreground">
                  지원 형식: Excel (.xlsx), CSV, JSON, TXT, PDF, HWPX
                </p>
              )}
            </div>
          )}

          {/* ── 직접 입력 탭 (T-208) ── */}
          {activeTab === "direct" && (
            <div className="flex flex-col gap-4">
              <label htmlFor="direct-input" className="text-sm text-muted-foreground">
                일정 내용을 자유롭게 입력하세요. 입력한 내용을 일정표 형식으로 정리해 불러옵니다.
              </label>
              <textarea
                id="direct-input"
                value={directText}
                onChange={(e) => setDirectText(e.target.value)}
                placeholder={`예시:\n1일차 — 인천 출발, 싱가포르 도착, 호텔 체크인\n2일차 — 센토사섬 관광, 유니버셜 스튜디오\n...`}
                rows={8}
                className="w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
              {directError && (
                <p role="alert" className="text-sm text-destructive">
                  {directError}
                </p>
              )}
            </div>
          )}
        </div>

        {/* 푸터 */}
        <div className="flex justify-end gap-2 border-t border-border px-4 py-3">
          <button
            type="button"
            onClick={() => {
              if (activeTab === "code") {
                handleLoadProduct();
                return;
              }
              if (activeTab === "file") {
                void handleParseFile();
                return;
              }
              void handleParseDirectInput();
            }}
            disabled={
              (activeTab === "code" && !searchResult) ||
              (activeTab === "file" && (fileLoading || !selectedFile)) ||
              (activeTab === "direct" && (!directText.trim() || directLoading))
            }
            className={FOOTER_PRIMARY_BUTTON_CLASS}
          >
            일정 불러오기
          </button>
          <button
            type="button"
            onClick={onClose}
            className={FOOTER_SECONDARY_BUTTON_CLASS}
          >
            취소
          </button>
        </div>
      </div>
    </div>
  );
}
