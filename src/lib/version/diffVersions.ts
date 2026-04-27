// src/lib/version/diffVersions.ts — T-503
// 두 QuoteData 버전 간 변경 내역 계산

import type { QuoteData, QuoteItem } from "@/types";

export type DiffAction = "added" | "removed" | "changed";

export interface QuoteItemDiff {
  action: DiffAction;
  /** removed: old 항목, added: new 항목, changed: new 항목 */
  item: QuoteItem;
  /** changed 일 때 변경 전 항목 */
  prevItem?: QuoteItem;
}

export interface VersionDiff {
  quoteItems: QuoteItemDiff[];
  /** 요약 카운트 */
  summary: {
    added: number;
    removed: number;
    changed: number;
  };
}

/**
 * T-503: 두 버전의 QuoteData를 비교해 변경 내역을 반환한다.
 * id 기준으로 매칭, id 없는 항목은 description 기준 매칭.
 */
export function diffVersions(
  fromData: QuoteData,
  toData: QuoteData
): VersionDiff {
  const diffs: QuoteItemDiff[] = [];

  const fromMap = new Map(fromData.items.map((it) => [it.id, it]));
  const toMap = new Map(toData.items.map((it) => [it.id, it]));

  // 추가 또는 변경
  for (const toItem of toData.items) {
    const fromItem = fromMap.get(toItem.id);
    if (!fromItem) {
      diffs.push({ action: "added", item: toItem });
    } else if (isChanged(fromItem, toItem)) {
      diffs.push({ action: "changed", item: toItem, prevItem: fromItem });
    }
  }

  // 삭제
  for (const fromItem of fromData.items) {
    if (!toMap.has(fromItem.id)) {
      diffs.push({ action: "removed", item: fromItem });
    }
  }

  const summary = {
    added: diffs.filter((d) => d.action === "added").length,
    removed: diffs.filter((d) => d.action === "removed").length,
    changed: diffs.filter((d) => d.action === "changed").length,
  };

  return { quoteItems: diffs, summary };
}

function isChanged(a: QuoteItem, b: QuoteItem): boolean {
  return (
    a.category !== b.category ||
    a.region !== b.region ||
    a.date !== b.date ||
    a.description !== b.description ||
    a.quantity !== b.quantity ||
    a.unitPrice !== b.unitPrice ||
    a.currencyRateId !== b.currencyRateId ||
    a.subtotal !== b.subtotal
  );
}
