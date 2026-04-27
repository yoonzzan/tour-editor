"use client";

// T-402: QuoteEditor 컴포넌트 껍데기 + 헤더
// T-403: 일정표 항목 연동 → 견적 행 자동 생성
// T-404: 단가 입력 → 합계 자동 계산 (디바운스 300ms)
// T-405: 항목별·구분별 건별합계 자동 계산
// T-406: 총 경비 섹션 (합계 + 수수료 + VAT + TOTAL)
// T-409: 가격 표시 방식 드롭다운 (sales 전용)

import { useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { useEditorStore } from "@/hooks/useEditorStore";
import {
  CATEGORY_LABELS,
  CATEGORY_ORDER,
  generateQuoteItems,
} from "@/lib/quote/generate";
import {
  DEFAULT_EXCHANGE_RATE_ID,
  calculateItemSubtotalKrw,
  getExchangeRateForItem,
  getQuoteExchangeRates,
  normalizeCurrencyCode,
  recalculateQuoteData,
} from "@/lib/quote/currency";
import { todayInKorea } from "@/lib/date/korea";
import { Role, type QuoteCategory, type QuoteExchangeRate, type QuoteItem } from "@/types";

type PriceMode = "상세" | "총액" | "숨김";

const CATEGORY_COLORS: Record<QuoteCategory, string> = {
  FLIGHT: "bg-blue-100 text-blue-700",
  HOTEL: "bg-purple-100 text-purple-700",
  SIGHTSEEING: "bg-green-100 text-green-700",
  MEAL: "bg-orange-100 text-orange-700",
  VEHICLE: "bg-cyan-100 text-cyan-700",
  GUIDE: "bg-pink-100 text-pink-700",
  OTHER: "bg-gray-100 text-gray-600",
};

function normalizeNumberInputValue(value: string): string {
  if (value === "") return "";
  return value.replace(/^0+(?=\d)/u, "");
}

function readNonNegativeInput(input: HTMLInputElement): number {
  const normalized = normalizeNumberInputValue(input.value);
  input.value = normalized;
  return Math.max(0, Number(normalized));
}

interface Props {
  role: Role;
}

export function QuoteEditor({ role }: Props) {
  const { itinerary, quote, setQuote } = useEditorStore();
  const [localItems, setLocalItems] = useState<QuoteItem[]>(
    quote?.items ?? []
  );
  const [agencyFee, setAgencyFee] = useState(
    quote?.summary.agencyFee ?? 0
  );
  const [groundProfit, setGroundProfit] = useState(
    quote?.summary.groundProfit ?? 0
  );
  const [exchangeRates, setExchangeRates] = useState<QuoteExchangeRate[]>(
    getQuoteExchangeRates(quote)
  );
  const [priceMode, setPriceMode] = useState<PriceMode>("상세");
  // 스토어 값 동기화
  useEffect(() => {
    if (quote) {
      setLocalItems(quote.items);
      setGroundProfit(quote.summary.groundProfit ?? 0);
      setAgencyFee(quote.summary.agencyFee);
      setExchangeRates(getQuoteExchangeRates(quote));
    }
  }, [quote]);

  // ── 계산 ───────────────────────────────────────────────
  const itemsWithSub = localItems.map((it) => ({
    ...it,
    currencyRateId: it.currencyRateId ?? DEFAULT_EXCHANGE_RATE_ID,
    subtotal: calculateItemSubtotalKrw(it, exchangeRates),
  }));
  const grandSubtotal = itemsWithSub.reduce((s, it) => s + it.subtotal, 0);
  const vat = Math.round(agencyFee * 0.1);
  const total = grandSubtotal + groundProfit + agencyFee + vat;
  const passengerCount =
    (itinerary?.overview.passengers.adult ?? 0) +
    (itinerary?.overview.passengers.child ?? 0) +
    (itinerary?.overview.passengers.infant ?? 0);
  const groundProfitPerPerson =
    passengerCount > 0 ? Math.round(groundProfit / passengerCount) : 0;
  const agencyFeePerPerson =
    passengerCount > 0 ? Math.round(agencyFee / passengerCount) : 0;

  // ── 즉시 스토어 반영 (T-404) ────────────────────────────
  const quoteHeader = quote?.header ?? { writtenAt: todayInKorea() };
  const validUntil = quoteHeader.validUntil || quoteHeader.writtenAt;

  function scheduleWrite(
    items: QuoteItem[],
    ground: number,
    fee: number,
    rates: QuoteExchangeRate[]
  ) {
    setQuote(recalculateQuoteData({
      header: quoteHeader,
      items,
      exchangeRates: rates,
      groundProfit: ground,
      agencyFee: fee,
    }));
  }

  function handleItemChange(updated: Partial<QuoteItem> & { id: string }) {
    const newItems = localItems.map((it) =>
      it.id === updated.id ? { ...it, ...updated } : it
    );
    setLocalItems(newItems);
    scheduleWrite(newItems, groundProfit, agencyFee, exchangeRates);
  }

  function handleGroundProfitChange(value: number) {
    setGroundProfit(value);
    scheduleWrite(localItems, value, agencyFee, exchangeRates);
  }

  function handleFeeChange(fee: number) {
    setAgencyFee(fee);
    scheduleWrite(localItems, groundProfit, fee, exchangeRates);
  }

  function handleValidUntilChange(value: string) {
    setQuote(recalculateQuoteData({
      header: {
        ...quoteHeader,
        validUntil: value || quoteHeader.writtenAt,
      },
      items: localItems,
      exchangeRates,
      groundProfit,
      agencyFee,
    }));
  }

  function handleRateChange(updated: QuoteExchangeRate) {
    const nextRates = exchangeRates.map((rate) =>
      rate.id === updated.id ? updated : rate
    );
    setExchangeRates(nextRates);
    scheduleWrite(localItems, groundProfit, agencyFee, nextRates);
  }

  function handleAddRate() {
    const newRate: QuoteExchangeRate = {
      id: uuidv4(),
      code: "USD",
      rateToKrw: 0,
    };
    const nextRates = [...exchangeRates, newRate];
    setExchangeRates(nextRates);
    scheduleWrite(localItems, groundProfit, agencyFee, nextRates);
  }

  function handleRemoveRate(rateId: string) {
    const nextRates = exchangeRates.filter((rate) => rate.id !== rateId);
    const nextItems = localItems.map((item) =>
      item.currencyRateId === rateId
        ? { ...item, currencyRateId: DEFAULT_EXCHANGE_RATE_ID }
        : item
    );
    setExchangeRates(nextRates);
    setLocalItems(nextItems);
    scheduleWrite(nextItems, groundProfit, agencyFee, nextRates);
  }

  function handleAutoGenerate() {
    if (!itinerary) return;
    const generated = generateQuoteItems(itinerary);
    setLocalItems(generated);
    scheduleWrite(generated, groundProfit, agencyFee, exchangeRates);
  }

  function handleAddRow(category: QuoteCategory) {
    const newItem: QuoteItem = {
      id: uuidv4(),
      category,
      region: "",
      date: "",
      description: "",
      quantity: 1,
      unitPrice: 0,
      currencyRateId: DEFAULT_EXCHANGE_RATE_ID,
      subtotal: 0,
    };
    const newItems = [...localItems, newItem].sort(
      (a, b) =>
        CATEGORY_ORDER.indexOf(a.category) - CATEGORY_ORDER.indexOf(b.category)
    );
    setLocalItems(newItems);
    scheduleWrite(newItems, groundProfit, agencyFee, exchangeRates);
  }

  function handleRemoveRow(id: string) {
    const newItems = localItems.filter((it) => it.id !== id);
    setLocalItems(newItems);
    scheduleWrite(newItems, groundProfit, agencyFee, exchangeRates);
  }

  // ── 그룹핑 (T-405) ────────────────────────────────────
  const grouped = CATEGORY_ORDER.map((cat) => ({
    category: cat,
    items: itemsWithSub.filter((it) => it.category === cat),
    subtotal: itemsWithSub
      .filter((it) => it.category === cat)
      .reduce((s, it) => s + it.subtotal, 0),
  })).filter((g) => g.items.length > 0);

  const isPartner = role === Role.PARTNER;
  const isSales = role === Role.SALES;
  const showPrices = priceMode !== "숨김";

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-4 pb-16">
      {/* ── 헤더 (T-402) ─────────────────────────────── */}
      <div className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3">
        <h2 className="text-sm font-semibold text-foreground">견적서 에디터</h2>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1.5 text-xs font-semibold text-red-600">
            유효기간
            <input
              type="date"
              value={validUntil}
              onChange={(e) => handleValidUntilChange(e.target.value)}
              aria-label="유효기간"
              className="rounded border border-input bg-background px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </label>

          {/* T-409: sales 전용 가격 표시 방식 */}
          {isSales && (
            <select
              aria-label="가격 표시 방식"
              value={priceMode}
              onChange={(e) => setPriceMode(e.target.value as PriceMode)}
              className="rounded border border-input bg-background px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="상세">상세</option>
              <option value="총액">총액</option>
              <option value="숨김">숨김</option>
            </select>
          )}

          {/* 자동 생성 버튼 */}
          {itinerary && (
            <button
              onClick={handleAutoGenerate}
              className="rounded-md border border-dashed border-border px-3 py-1.5 text-xs text-muted-foreground hover:border-primary hover:text-primary"
            >
              일정에서 자동 생성
            </button>
          )}
        </div>
      </div>

      {showPrices && (
        <section className="rounded-lg border border-border bg-card p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              환율 설정
            </h3>
            <button
              type="button"
              onClick={handleAddRate}
              className="rounded-md border border-dashed border-border px-2.5 py-1 text-xs text-muted-foreground hover:border-primary hover:text-primary"
            >
              + 통화
            </button>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {exchangeRates.map((rate) => {
              const isDefault = rate.id === DEFAULT_EXCHANGE_RATE_ID;
              return (
                <div
                  key={rate.id}
                  className="grid grid-cols-[auto_4.5rem_auto_1fr_auto] items-center gap-2 text-xs"
                >
                  <span className="text-muted-foreground">1</span>
                  <input
                    type="text"
                    value={rate.code}
                    disabled={isDefault}
                    onChange={(e) =>
                      handleRateChange({
                        ...rate,
                        code: normalizeCurrencyCode(e.target.value),
                      })
                    }
                    aria-label="통화코드"
                    className="rounded border border-input bg-transparent px-2 py-1 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-ring disabled:bg-muted/40"
                  />
                  <span className="text-muted-foreground">=</span>
                  <input
                    type="number"
                    min={0}
                    step={1}
                    inputMode="decimal"
                    value={rate.rateToKrw}
                    disabled={isDefault}
                    onChange={(e) =>
                      handleRateChange({
                        ...rate,
                        rateToKrw: readNonNegativeInput(e.currentTarget),
                      })
                    }
                    aria-label={`${rate.code} 원화 환율`}
                    className="rounded border border-input bg-transparent px-2 py-1 text-right text-xs focus:outline-none focus:ring-1 focus:ring-ring disabled:bg-muted/40"
                  />
                  <div className="flex items-center gap-1">
                    <span className="text-muted-foreground">원</span>
                    {!isDefault && (
                      <button
                        type="button"
                        onClick={() => handleRemoveRate(rate.id)}
                        aria-label={`${rate.code} 환율 삭제`}
                        className="rounded px-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ── 빈 상태 안내 ──────────────────────────────── */}
      {localItems.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border py-12 text-center">
          <p className="text-sm text-muted-foreground">
            견적 항목이 없습니다.
          </p>
          {itinerary ? (
            <button
              onClick={handleAutoGenerate}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
            >
              일정표에서 자동 생성
            </button>
          ) : (
            <p className="text-xs text-muted-foreground">
              먼저 일정표 탭에서 일정을 불러오세요.
            </p>
          )}
        </div>
      )}

      {/* ── 구분별 테이블 (T-403, T-404, T-405) ─────── */}
      {grouped.map(({ category, items, subtotal: catSubtotal }) => (
        <section key={category} className="rounded-lg border border-border bg-card overflow-hidden">
          {/* 구분 헤더 */}
          <div className="flex items-center justify-between border-b border-border bg-muted/30 px-4 py-2">
            <span
              className={`rounded px-2 py-0.5 text-xs font-semibold ${CATEGORY_COLORS[category]}`}
            >
              {CATEGORY_LABELS[category]}
            </span>
            {showPrices && (
              <span className="text-xs font-medium text-foreground">
                소계: {catSubtotal.toLocaleString()} 원
              </span>
            )}
          </div>

          {/* 행 목록 */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="px-3 py-2 text-center font-medium w-24">날짜</th>
                  <th className="px-3 py-2 text-center font-medium w-24">지역</th>
                  <th className="px-3 py-2 text-center font-medium w-56">내용</th>
                  {showPrices && (
                    <>
                      <th className="px-3 py-2 text-center font-medium w-16">수량</th>
                      <th className="px-3 py-2 text-center font-medium w-44">단가</th>
                      <th className="px-3 py-2 text-center font-medium w-28">합계 (원)</th>
                    </>
                  )}
                  <th className="px-3 py-2 w-8"></th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <QuoteRow
                    key={item.id}
                    item={item}
                    exchangeRates={exchangeRates}
                    showPrices={showPrices}
                    category={category}
                    onChange={handleItemChange}
                    onRemove={() => handleRemoveRow(item.id)}
                  />
                ))}
              </tbody>
            </table>
          </div>

          {/* 행 추가 */}
          <div className="border-t border-border px-3 py-1.5">
            <button
              onClick={() => handleAddRow(category)}
              className="text-xs text-muted-foreground hover:text-primary"
            >
              + {CATEGORY_LABELS[category]} 행 추가
            </button>
          </div>
        </section>
      ))}

      {/* 전체 행 추가 드롭다운 영역 */}
      {localItems.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {CATEGORY_ORDER.map((cat) => (
            <button
              key={cat}
              onClick={() => handleAddRow(cat)}
              className="rounded-md border border-dashed border-border px-2.5 py-1 text-xs text-muted-foreground hover:border-primary hover:text-primary"
            >
              + {CATEGORY_LABELS[cat]}
            </button>
          ))}
        </div>
      )}

      {/* ── 총 경비 섹션 (T-406) ─────────────────────── */}
      {localItems.length > 0 && (
        <section className="rounded-lg border border-border bg-card p-4">
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            총 경비
          </h3>

          {priceMode === "숨김" ? (
            <p className="text-xs text-muted-foreground">가격이 숨겨진 상태입니다.</p>
          ) : priceMode === "총액" ? (
            <div className="flex items-center justify-between rounded-md bg-muted/40 px-4 py-3">
              <span className="text-sm font-semibold text-foreground">총액</span>
              <span className="text-sm font-bold text-primary">
                {total.toLocaleString()} 원
              </span>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <SummaryRow label="항목소계" value={grandSubtotal} />
              {(isPartner || groundProfit > 0) && (
                <div className="grid grid-cols-[8rem_1fr] items-center gap-3 px-3 py-1 text-sm">
                  <label className="text-muted-foreground">
                    지상비수익
                  </label>
                  <div className="flex flex-wrap items-center justify-end gap-2">
                    {isPartner ? (
                      <input
                        type="number"
                        min={0}
                        step={1000}
                        inputMode="numeric"
                        value={groundProfit}
                        onChange={(e) =>
                          handleGroundProfitChange(readNonNegativeInput(e.currentTarget))
                        }
                        aria-label="지상비수익"
                        className="w-36 rounded border border-input bg-transparent px-2 py-0.5 text-right text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                      />
                    ) : (
                      <span className="w-36 text-right font-medium text-foreground">
                        {groundProfit.toLocaleString()}
                      </span>
                    )}
                    <span className="text-muted-foreground">원</span>
                    <span className="text-xs text-muted-foreground">
                      1인당 {groundProfitPerPerson.toLocaleString()} 원
                    </span>
                  </div>
                </div>
              )}
              <div className="grid grid-cols-[8rem_1fr] items-center gap-3 px-3 py-1 text-sm">
                <label className="text-muted-foreground">
                  하나투어수익
                </label>
                <div className="flex flex-wrap items-center justify-end gap-2">
                  <input
                    type="number"
                    min={0}
                    step={1000}
                    inputMode="numeric"
                    value={agencyFee}
                    onChange={(e) =>
                      handleFeeChange(readNonNegativeInput(e.currentTarget))
                    }
                    aria-label="하나투어수익"
                    className="w-36 rounded border border-input bg-transparent px-2 py-0.5 text-right text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                  <span className="text-muted-foreground">원</span>
                  <span className="text-xs text-muted-foreground">
                    1인당 {agencyFeePerPerson.toLocaleString()} 원
                  </span>
                </div>
              </div>
              <SummaryRow label="VAT" value={vat} />
              <div className="mt-1 grid grid-cols-[8rem_1fr] items-center rounded-md bg-primary/10 px-3 py-2">
                <span className="text-sm font-semibold text-foreground">TOTAL</span>
                <span className="text-right text-sm font-bold text-primary">
                  {total.toLocaleString()} 원
                </span>
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  );
}

// ── 견적 행 컴포넌트 ─────────────────────────────────────

interface QuoteRowProps {
  item: QuoteItem;
  exchangeRates: QuoteExchangeRate[];
  showPrices: boolean;
  category: QuoteCategory;
  onChange: (updated: Partial<QuoteItem> & { id: string }) => void;
  onRemove: () => void;
}

function QuoteRow({ item, exchangeRates, showPrices, onChange, onRemove }: QuoteRowProps) {
  const selectedRate = getExchangeRateForItem(exchangeRates, item);
  return (
    <tr className="border-b border-border last:border-0 hover:bg-muted/20">
      <td className="px-3 py-1.5">
        <input
          type="date"
          value={item.date}
          onChange={(e) => onChange({ id: item.id, date: e.target.value })}
          aria-label="날짜"
          className="w-full rounded border border-input bg-transparent px-1 py-0.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
        />
      </td>
      <td className="px-3 py-1.5">
        <input
          type="text"
          value={item.region}
          onChange={(e) => onChange({ id: item.id, region: e.target.value })}
          placeholder="지역"
          aria-label="지역"
          className="w-full rounded border border-input bg-transparent px-1 py-0.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
        />
      </td>
          <td className="px-3 py-1.5">
            <input
              type="text"
              value={item.description}
          onChange={(e) =>
            onChange({ id: item.id, description: e.target.value })
          }
          placeholder="내용"
          aria-label="내용"
          className="w-full rounded border border-input bg-transparent px-1 py-0.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
        />
      </td>
      {showPrices && (
        <>
          <td className="px-3 py-1.5">
              <input
                type="number"
                min={1}
                step={1}
                inputMode="numeric"
                value={item.quantity}
                onChange={(e) =>
                  onChange({
                    id: item.id,
                  quantity: Math.max(1, readNonNegativeInput(e.currentTarget)),
                })
              }
              aria-label="수량"
              className="w-full rounded border border-input bg-transparent px-1 py-0.5 text-right text-xs focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </td>
          <td className="relative px-3 py-1.5 w-44">
            <div className="flex items-center rounded border border-input bg-transparent focus-within:ring-1 focus-within:ring-ring">
              <select
                value={selectedRate.id}
                onChange={(e) =>
                  onChange({ id: item.id, currencyRateId: e.target.value })
                }
                aria-label="단가 통화"
                className="w-14 border-r border-input bg-transparent px-1 py-0.5 text-xs text-muted-foreground focus:outline-none"
              >
                {exchangeRates.map((rate) => (
                  <option key={rate.id} value={rate.id}>
                    {rate.code}
                  </option>
                ))}
              </select>
              <input
                type="number"
                min={0}
                step={1000}
                inputMode="numeric"
                value={item.unitPrice}
                onChange={(e) =>
                  onChange({
                    id: item.id,
                    unitPrice: readNonNegativeInput(e.currentTarget),
                  })
                }
                aria-label="단가"
                className="w-full min-w-0 bg-transparent px-1 py-0.5 text-right text-xs focus:outline-none"
              />
            </div>
          </td>
          <td className="px-3 py-1.5 text-right font-medium text-foreground">
            {item.subtotal.toLocaleString()} 원
          </td>
        </>
      )}
      <td className="px-3 py-1.5 text-center">
        <button
          onClick={onRemove}
          aria-label="행 삭제"
          className="rounded p-0.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
        >
          ✕
        </button>
      </td>
    </tr>
  );
}

// ── 합계 행 ─────────────────────────────────────────────

function SummaryRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="grid grid-cols-[8rem_1fr] items-center gap-3 px-3 py-1 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium text-foreground">{value.toLocaleString()} 원</span>
    </div>
  );
}
