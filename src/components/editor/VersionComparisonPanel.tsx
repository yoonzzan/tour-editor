"use client";

import { ListFilter, RotateCcw } from "lucide-react";
import { useState, type ReactNode } from "react";
import type { ItineraryData, QuoteData, QuoteCategory, QuoteItem } from "@/types";
import {
  buildItineraryDisplayDays,
  type ItineraryDisplayRow,
} from "@/lib/itinerary/itineraryDisplay";
import {
  calculateItemSubtotalKrw,
  getExchangeRateForItem,
  getQuoteExchangeRates,
} from "@/lib/quote/currency";

type ChangeType = "unchanged" | "added" | "removed" | "changed";

interface VersionDetail {
  versionNo: string;
  itineraryData: ItineraryData;
  quoteData: QuoteData;
}

interface Props {
  leftVersion: VersionDetail;
  rightVersion: VersionDetail;
}

interface ItineraryCompareState {
  leftById: Map<string, ChangeType>;
  rightById: Map<string, ChangeType>;
  summary: {
    unchanged: number;
    added: number;
    removed: number;
    changed: number;
  };
}

interface QuoteCompareState {
  leftById: Map<string, ChangeType>;
  rightById: Map<string, ChangeType>;
  summary: {
    unchanged: number;
    added: number;
    removed: number;
    changed: number;
  };
}

function toReadableDate(input: string): string {
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) return input || "-";
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}. ${m}. ${d}.`;
}

function getChangeClass(action: ChangeType): string {
  if (action === "added") {
    return "bg-emerald-50 border-emerald-200 text-emerald-900";
  }
  if (action === "removed") {
    return "bg-rose-50 border-rose-200 text-rose-900";
  }
  if (action === "changed") {
    return "bg-amber-50 border-amber-200 text-amber-900";
  }
  return "border-transparent";
}

function getChangeBadge(action: ChangeType): string {
  if (action === "added") return "추가";
  if (action === "removed") return "삭제";
  if (action === "changed") return "변경";
  return "동일";
}

function formatCount(n: number): string {
  return n > 0 ? `+${n}` : "0";
}

function toQuoteCategoryLabel(category: QuoteCategory | string): string {
  if (category === "HOTEL") return "숙박";
  if (category === "MEAL") return "식사";
  if (category === "SIGHTSEEING") return "관광";
  if (category === "FLIGHT") return "항공";
  if (category === "VEHICLE") return "차량";
  if (category === "GUIDE") return "가이드";
  return "기타";
}

function compareItineraryRows(
  left: ItineraryData,
  right: ItineraryData
): ItineraryCompareState {
  const leftBlocks = buildItineraryDisplayDays(left.days);
  const rightBlocks = buildItineraryDisplayDays(right.days);
  const leftRows = leftBlocks.flatMap((day) => day.rows);
  const rightRows = rightBlocks.flatMap((day) => day.rows);
  const rightRowById = new Map<string, ItineraryDisplayRow>();
  const rightStatusById = new Map<string, ChangeType>();
  const matchedRight = new Set<string>();

  for (const row of rightRows) {
    rightRowById.set(row.id, row);
  }

  const leftStatusById = new Map<string, ChangeType>();

  const summary = {
    unchanged: 0,
    added: 0,
    removed: 0,
    changed: 0,
  };

  for (const leftRow of leftRows) {
    const matched = rightRowById.get(leftRow.id);
    if (matched) {
      matchedRight.add(leftRow.id);
      const isChanged =
        leftRow.region !== matched.region ||
        leftRow.transport !== matched.transport ||
        leftRow.time !== matched.time ||
        leftRow.detail !== matched.detail ||
        leftRow.detailDescription !== matched.detailDescription ||
        leftRow.meal !== matched.meal ||
        leftRow.isHotel !== matched.isHotel;

      const status: ChangeType = isChanged ? "changed" : "unchanged";
      leftStatusById.set(leftRow.id, status);
      rightStatusById.set(leftRow.id, status);
      summary[status] += 1;
      continue;
    }

    leftStatusById.set(leftRow.id, "removed");
    summary.removed += 1;
  }

  for (const rightRow of rightRows) {
    if (matchedRight.has(rightRow.id)) continue;
    rightStatusById.set(rightRow.id, "added");
    summary.added += 1;
  }

  return { leftById: leftStatusById, rightById: rightStatusById, summary };
}

function compareQuoteRows(left: QuoteData, right: QuoteData): QuoteCompareState {
  const leftById = new Map<string, ChangeType>();
  const rightById = new Map<string, ChangeType>();
  const summary = {
    unchanged: 0,
    added: 0,
    removed: 0,
    changed: 0,
  };
  const rightMap = new Map<string, QuoteItem>();
  const matchedRight = new Set<string>();

  for (const item of right.items) {
    rightMap.set(item.id, item);
  }

  for (const leftItem of left.items) {
    const matched = rightMap.get(leftItem.id);
    if (!matched) {
      leftById.set(leftItem.id, "removed");
      summary.removed += 1;
      continue;
    }

    matchedRight.add(leftItem.id);
    const isChanged =
      leftItem.category !== matched.category ||
      leftItem.region !== matched.region ||
      leftItem.date !== matched.date ||
      leftItem.description !== matched.description ||
      leftItem.quantity !== matched.quantity ||
      leftItem.unitPrice !== matched.unitPrice ||
      leftItem.currencyRateId !== matched.currencyRateId ||
      leftItem.subtotal !== matched.subtotal;

    const action: ChangeType = isChanged ? "changed" : "unchanged";
    leftById.set(leftItem.id, action);
    rightById.set(leftItem.id, action);
    summary[action] += 1;
  }

  for (const rightItem of right.items) {
    if (matchedRight.has(rightItem.id)) continue;
    rightById.set(rightItem.id, "added");
    summary.added += 1;
  }

  return { leftById, rightById, summary };
}

function renderDetailText(value: string, description = "", isHotel = false): ReactNode {
  const text = value.trim();
  const detailDescription = description.trim();
  if (!text && !detailDescription) return "-";
  const descriptionNode = detailDescription ? (
    <>
      {text ? <br /> : null}
      <span>{detailDescription}</span>
    </>
  ) : null;
  if (!isHotel) {
    return (
      <span className="whitespace-pre-wrap">
        <span className="font-semibold">{text}</span>
        {descriptionNode}
      </span>
    );
  }

  const hotelMatch = /^(?:\[(?:숙박|호텔)\]|(숙박|호텔))\s*:?\s*(.*)$/u.exec(text);
  if (!hotelMatch) {
    return (
      <span>
        <span className="font-semibold">숙박</span>
        {text ? ` ${text}` : ""}
        {descriptionNode}
      </span>
    );
  }

  const label = (hotelMatch[1] as string) ?? "숙박";
  const detail = (hotelMatch[2] ?? "").trim();
  return (
    <span>
      <span className="font-semibold">{label}</span>
      {detail ? ` ${detail}` : ""}
      {descriptionNode}
    </span>
  );
}

function renderMeal(value: string): ReactNode {
  const lines = value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  if (lines.length === 0) return "-";

  return (
    <span>
      {lines.map((line, index) => {
        const isLast = index === lines.length - 1;
        return (
          <span key={`${line}-${index}`}>
            <span className="whitespace-pre-wrap">{line}</span>
            {!isLast ? <br /> : null}
          </span>
        );
      })}
    </span>
  );
}

function ItineraryDocument({
  versionNo,
  title,
  itineraryData,
  statusById,
  showOnlyChanges,
}: {
  versionNo: string;
  title: string;
  itineraryData: ItineraryData;
  statusById: Map<string, ChangeType>;
  showOnlyChanges: boolean;
}) {
  const rows = buildItineraryDisplayDays(itineraryData.days);
  const displayRows = rows
    .map((day) => ({
      ...day,
      rows: showOnlyChanges
        ? day.rows.filter((row) => (statusById.get(row.id) ?? "unchanged") !== "unchanged")
        : day.rows,
    }))
    .filter((day) => day.rows.length > 0);

  return (
    <section className="rounded-lg border border-border">
      <div className="bg-muted/20 border-b border-border px-3 py-2 text-xs font-semibold">
        {title}
      </div>
      <div className="overflow-hidden">
        <table className="w-full table-fixed text-[11px]">
          <colgroup>
            <col className="w-[8%]" />
            <col className="w-[8%]" />
            <col className="w-[12%]" />
            <col className="w-[9%]" />
            <col className="w-[10%]" />
            <col className="w-[8%]" />
            <col className="w-[34%]" />
            <col className="w-[11%]" />
          </colgroup>
          <thead className="bg-muted/10 text-center">
            <tr>
              <th className="px-1.5 py-2">상태</th>
              <th className="px-1.5 py-2">일차</th>
              <th className="px-1.5 py-2">일자</th>
              <th className="px-1.5 py-2">지역</th>
              <th className="px-1.5 py-2">교통편</th>
              <th className="px-1.5 py-2">시간</th>
              <th className="px-1.5 py-2">세부일정</th>
              <th className="px-1.5 py-2">식사</th>
            </tr>
          </thead>
          <tbody>
            {displayRows.length === 0 ? (
              <tr>
                <td
                  colSpan={8}
                  className="px-2 py-3 text-center text-muted-foreground"
                >
                  {showOnlyChanges ? "변경된 일정이 없습니다." : "일정이 없습니다."}
                </td>
              </tr>
            ) : (
              displayRows.flatMap((day) => {
                return day.rows.map((row) => {
                  const status = statusById.get(row.id) ?? "unchanged";
                  const dayLabel = `제 ${day.dayNo}일`;
                  return (
                    <tr key={`${day.dayNo}-${row.id}`} className={`border-t border-border ${getChangeClass(status)}`}>
                      <td className="whitespace-nowrap px-1.5 py-1.5 text-center">
                        <span className="rounded bg-white/80 px-1.5 py-0.5 text-[10px] font-semibold">
                          {getChangeBadge(status)}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-1.5 py-1.5 text-center">
                        {dayLabel}
                      </td>
                      <td className="whitespace-nowrap px-1.5 py-1.5 text-center">
                        {toReadableDate(row.date)}
                      </td>
                      <td className="px-1.5 py-1.5 text-center">{row.region || "-"}</td>
                      <td className="px-1.5 py-1.5 text-center">{row.transport || "-"}</td>
                      <td className="px-1.5 py-1.5 text-center">{row.time || "-"}</td>
                      <td className="px-1.5 py-1.5">
                        {renderDetailText(row.detail || "", row.detailDescription, row.isHotel)}
                      </td>
                      <td className="px-1.5 py-1.5">
                        {renderMeal(row.meal || "-")}
                      </td>
                    </tr>
                  );
                });
              })
            )}
          </tbody>
        </table>
      </div>
      <div className="border-t border-border bg-muted/10 px-3 py-2 text-[11px] text-muted-foreground">
        버전 {versionNo}
      </div>
    </section>
  );
}

function QuoteDocument({
  title,
  quoteData,
  statusById,
  showOnlyChanges,
}: {
  title: string;
  quoteData: QuoteData;
  statusById: Map<string, ChangeType>;
  showOnlyChanges: boolean;
}) {
  const { items, summary } = quoteData;
  const exchangeRates = getQuoteExchangeRates(quoteData);
  const subtotal = items.reduce(
    (sum, item) => sum + calculateItemSubtotalKrw(item, exchangeRates),
    0
  );
  const groundProfit = summary.groundProfit ?? 0;
  const total = subtotal + groundProfit + summary.agencyFee + summary.vat;
  const displayItems = showOnlyChanges
    ? items.filter((item) => (statusById.get(item.id) ?? "unchanged") !== "unchanged")
    : items;

  return (
    <section className="rounded-lg border border-border">
      <div className="bg-muted/20 border-b border-border px-3 py-2 text-xs font-semibold">
        {title}
      </div>
      <div className="overflow-hidden">
        <table className="w-full table-fixed text-[11px]">
          <colgroup>
            <col className="w-[8%]" />
            <col className="w-[8%]" />
            <col className="w-[10%]" />
            <col className="w-[11%]" />
            <col className="w-[35%]" />
            <col className="w-[8%]" />
            <col className="w-[10%]" />
            <col className="w-[10%]" />
          </colgroup>
          <thead className="bg-muted/10 text-center">
            <tr>
              <th className="px-1.5 py-2">상태</th>
              <th className="px-1.5 py-2">구분</th>
              <th className="px-1.5 py-2">지역</th>
              <th className="px-1.5 py-2">날짜</th>
              <th className="px-1.5 py-2">상세내역</th>
              <th className="px-1.5 py-2">수량</th>
              <th className="px-1.5 py-2">단가</th>
              <th className="px-1.5 py-2">합계</th>
            </tr>
          </thead>
          <tbody>
            {displayItems.length === 0 ? (
              <tr>
                <td
                  colSpan={8}
                  className="px-2 py-3 text-center text-muted-foreground"
                >
                  {showOnlyChanges ? "변경된 견적 항목이 없습니다." : "항목이 없습니다."}
                </td>
              </tr>
            ) : (
              displayItems.map((item) => {
                const status = statusById.get(item.id) ?? "unchanged";
                const changeClass = getChangeClass(status);
                return (
                  <tr
                    key={item.id}
                    className={`border-t border-border ${changeClass}`}
                  >
                    <td className="px-1.5 py-1.5 text-center">
                      <span className="rounded bg-white/80 px-1.5 py-0.5 text-[10px] font-semibold">
                        {getChangeBadge(status)}
                      </span>
                    </td>
                    <td className="px-1.5 py-1.5 text-center">
                      {toQuoteCategoryLabel(item.category)}
                    </td>
                    <td className="px-1.5 py-1.5 text-center">{item.region || "-"}</td>
                    <td className="px-1.5 py-1.5 text-center">{item.date || "-"}</td>
                    <td className="px-1.5 py-1.5 whitespace-pre-wrap">
                      {item.description || "-"}
                    </td>
                    <td className="px-1.5 py-1.5 text-center">{item.quantity}</td>
                    <td className="px-1.5 py-1.5 text-center">
                      {getExchangeRateForItem(exchangeRates, item).code} {item.unitPrice.toLocaleString()}
                    </td>
                    <td className="px-1.5 py-1.5 text-right">
                      {calculateItemSubtotalKrw(item, exchangeRates).toLocaleString()}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      <div className="border-t border-border bg-muted/10 px-3 py-2 text-xs text-muted-foreground">
        <dl className="grid grid-cols-2 gap-2 text-[11px]">
          <div className="flex items-center justify-between">
            <dt>합계</dt>
            <dd className="font-medium text-foreground">
              {subtotal.toLocaleString()}
            </dd>
          </div>
          {groundProfit > 0 && (
            <div className="flex items-center justify-between">
              <dt>지상비 수익</dt>
              <dd className="font-medium text-foreground">{groundProfit.toLocaleString()}</dd>
            </div>
          )}
          <div className="flex items-center justify-between">
            <dt>여행사 수수료</dt>
            <dd className="font-medium text-foreground">{summary.agencyFee.toLocaleString()}</dd>
          </div>
          <div className="flex items-center justify-between">
            <dt>VAT</dt>
            <dd className="font-medium text-foreground">{summary.vat.toLocaleString()}</dd>
          </div>
          <div className="flex items-center justify-between">
            <dt className="font-semibold text-foreground">TOTAL</dt>
            <dd className="font-semibold text-foreground">{total.toLocaleString()}</dd>
          </div>
        </dl>
      </div>
    </section>
  );
}

export function VersionComparisonPanel({ leftVersion, rightVersion }: Props) {
  const [showOnlyChanges, setShowOnlyChanges] = useState(false);
  const itineraryDiff = compareItineraryRows(
    leftVersion.itineraryData,
    rightVersion.itineraryData
  );
  const quoteDiff = compareQuoteRows(
    leftVersion.quoteData,
    rightVersion.quoteData
  );
  const totalChanges =
    itineraryDiff.summary.added +
    itineraryDiff.summary.removed +
    itineraryDiff.summary.changed +
    quoteDiff.summary.added +
    quoteDiff.summary.removed +
    quoteDiff.summary.changed;

  return (
    <div className="space-y-4 p-3">
      <div className="sticky top-0 z-10 rounded border border-border bg-background/95 px-3 py-2 shadow-sm backdrop-blur">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h4 className="text-sm font-semibold text-foreground">버전 비교</h4>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {leftVersion.versionNo} ↔ {rightVersion.versionNo}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowOnlyChanges((value) => !value)}
            className="inline-flex h-8 items-center gap-1.5 rounded border border-border px-2 text-xs font-medium text-foreground hover:bg-muted"
          >
            {showOnlyChanges ? (
              <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
            ) : (
              <ListFilter className="h-3.5 w-3.5" aria-hidden="true" />
            )}
            {showOnlyChanges ? "전체 보기" : "변경만 보기"}
          </button>
        </div>
        <div className="mt-2 flex flex-wrap gap-2 text-[10px]">
          <span className="rounded bg-muted px-2 py-1 text-muted-foreground">
            변경 합계 {formatCount(totalChanges)}
          </span>
          <span className="rounded bg-emerald-100 px-2 py-1 text-emerald-700">
            일정표 추가 {formatCount(itineraryDiff.summary.added)}
          </span>
          <span className="rounded bg-rose-100 px-2 py-1 text-rose-700">
            일정표 삭제 {formatCount(itineraryDiff.summary.removed)}
          </span>
          <span className="rounded bg-amber-100 px-2 py-1 text-amber-700">
            일정표 변경 {formatCount(itineraryDiff.summary.changed)}
          </span>
          <span className="rounded bg-emerald-100 px-2 py-1 text-emerald-700">
            견적서 추가 {formatCount(quoteDiff.summary.added)}
          </span>
          <span className="rounded bg-rose-100 px-2 py-1 text-rose-700">
            견적서 삭제 {formatCount(quoteDiff.summary.removed)}
          </span>
          <span className="rounded bg-amber-100 px-2 py-1 text-amber-700">
            견적서 변경 {formatCount(quoteDiff.summary.changed)}
          </span>
        </div>
      </div>

      <div className="space-y-2">
        <h5 className="text-xs font-semibold text-muted-foreground">일정표</h5>
        <div className="grid gap-2 lg:grid-cols-2">
          <ItineraryDocument
            versionNo={leftVersion.versionNo}
            title={`일정표 (${leftVersion.versionNo})`}
            itineraryData={leftVersion.itineraryData}
            statusById={itineraryDiff.leftById}
            showOnlyChanges={showOnlyChanges}
          />
          <ItineraryDocument
            versionNo={rightVersion.versionNo}
            title={`일정표 (${rightVersion.versionNo})`}
            itineraryData={rightVersion.itineraryData}
            statusById={itineraryDiff.rightById}
            showOnlyChanges={showOnlyChanges}
          />
        </div>
      </div>

      <div className="space-y-2">
        <h5 className="text-xs font-semibold text-muted-foreground">견적서</h5>
        <div className="grid gap-2 lg:grid-cols-2">
          <QuoteDocument
            title={`견적서 (${leftVersion.versionNo})`}
            quoteData={leftVersion.quoteData}
            statusById={quoteDiff.leftById}
            showOnlyChanges={showOnlyChanges}
          />
          <QuoteDocument
            title={`견적서 (${rightVersion.versionNo})`}
            quoteData={rightVersion.quoteData}
            statusById={quoteDiff.rightById}
            showOnlyChanges={showOnlyChanges}
          />
        </div>
      </div>
    </div>
  );
}
