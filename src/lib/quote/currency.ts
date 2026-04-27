import type { QuoteData, QuoteExchangeRate, QuoteItem } from "@/types";

export const DEFAULT_EXCHANGE_RATE_ID = "krw";

export const DEFAULT_EXCHANGE_RATE: QuoteExchangeRate = {
  id: DEFAULT_EXCHANGE_RATE_ID,
  code: "KRW",
  rateToKrw: 1,
};

export function normalizeCurrencyCode(code: string): string {
  return code.trim().toUpperCase().replace(/\s+/g, "");
}

export function normalizeExchangeRate(rate: QuoteExchangeRate): QuoteExchangeRate {
  const code = normalizeCurrencyCode(rate.code) || DEFAULT_EXCHANGE_RATE.code;
  const rateToKrw = Number.isFinite(rate.rateToKrw) && rate.rateToKrw > 0
    ? rate.rateToKrw
    : DEFAULT_EXCHANGE_RATE.rateToKrw;
  return {
    id: rate.id.trim() || DEFAULT_EXCHANGE_RATE.id,
    code,
    rateToKrw,
  };
}

export function getQuoteExchangeRates(quote?: Pick<QuoteData, "exchangeRates"> | null): QuoteExchangeRate[] {
  const source = quote?.exchangeRates ?? [];
  const normalized = source.map(normalizeExchangeRate);
  const uniqueById = new Map<string, QuoteExchangeRate>();

  uniqueById.set(DEFAULT_EXCHANGE_RATE.id, DEFAULT_EXCHANGE_RATE);
  for (const rate of normalized) {
    uniqueById.set(rate.id, rate);
  }

  return Array.from(uniqueById.values());
}

export function getExchangeRateForItem(
  exchangeRates: QuoteExchangeRate[],
  item: Pick<QuoteItem, "currencyRateId">
): QuoteExchangeRate {
  return (
    exchangeRates.find((rate) => rate.id === item.currencyRateId) ??
    exchangeRates.find((rate) => rate.id === DEFAULT_EXCHANGE_RATE.id) ??
    DEFAULT_EXCHANGE_RATE
  );
}

export function calculateItemSubtotalKrw(
  item: Pick<QuoteItem, "quantity" | "unitPrice" | "currencyRateId">,
  exchangeRates: QuoteExchangeRate[]
): number {
  const rate = getExchangeRateForItem(exchangeRates, item);
  return Math.round(item.quantity * item.unitPrice * rate.rateToKrw);
}

export function recalculateQuoteItems(
  items: QuoteItem[],
  exchangeRates: QuoteExchangeRate[]
): QuoteItem[] {
  return items.map((item) => ({
    ...item,
    currencyRateId: item.currencyRateId ?? DEFAULT_EXCHANGE_RATE.id,
    subtotal: calculateItemSubtotalKrw(item, exchangeRates),
  }));
}

export function recalculateQuoteData(params: {
  header: QuoteData["header"];
  items: QuoteItem[];
  exchangeRates: QuoteExchangeRate[];
  groundProfit?: number;
  agencyFee: number;
}): QuoteData {
  const exchangeRates = getQuoteExchangeRates({ exchangeRates: params.exchangeRates });
  const items = recalculateQuoteItems(params.items, exchangeRates);
  const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
  const groundProfit = params.groundProfit ?? 0;
  const vat = Math.round(params.agencyFee * 0.1);
  const header = {
    ...params.header,
    validUntil: params.header.validUntil || params.header.writtenAt,
  };

  return {
    header,
    exchangeRates,
    items,
    summary: {
      subtotal,
      groundProfit,
      agencyFee: params.agencyFee,
      vat,
      total: subtotal + groundProfit + params.agencyFee + vat,
    },
  };
}
