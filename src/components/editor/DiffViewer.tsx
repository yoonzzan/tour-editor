"use client";

// T-511: Diff 뷰어 UI (추가=녹색, 삭제=빨강, 변경=노랑)

import type { VersionDiff, QuoteItemDiff } from "@/lib/version/diffVersions";
import { CATEGORY_LABELS } from "@/lib/quote/generate";

interface Props {
  from: string;
  to: string;
  diff: VersionDiff;
}

export function DiffViewer({ from, to, diff }: Props) {
  const { quoteItems, summary } = diff;

  if (quoteItems.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center">
        <p className="text-sm text-muted-foreground">
          {from} → {to} 변경 내역 없음
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 요약 배지 */}
      <div className="flex items-center gap-2 text-xs">
        <span className="font-medium text-muted-foreground">
          {from} → {to}
        </span>
        <span className="flex items-center gap-1">
          {summary.added > 0 && (
            <span className="rounded bg-green-100 px-1.5 py-0.5 font-medium text-green-700">
              +{summary.added} 추가
            </span>
          )}
          {summary.removed > 0 && (
            <span className="rounded bg-red-100 px-1.5 py-0.5 font-medium text-red-700">
              -{summary.removed} 삭제
            </span>
          )}
          {summary.changed > 0 && (
            <span className="rounded bg-yellow-100 px-1.5 py-0.5 font-medium text-yellow-700">
              ~{summary.changed} 변경
            </span>
          )}
        </span>
      </div>

      {/* Diff 테이블 */}
      <div className="overflow-hidden rounded-lg border border-border">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-muted/50 text-muted-foreground">
              <th className="w-16 px-3 py-2 text-center font-medium">상태</th>
              <th className="px-3 py-2 text-left font-medium">구분</th>
              <th className="px-3 py-2 text-left font-medium">내용</th>
              <th className="px-3 py-2 text-right font-medium">수량</th>
              <th className="px-3 py-2 text-right font-medium">단가</th>
              <th className="px-3 py-2 text-right font-medium">합계(원)</th>
            </tr>
          </thead>
          <tbody>
            {quoteItems.map((d, idx) => (
              <DiffRow key={idx} diff={d} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function DiffRow({ diff }: { diff: QuoteItemDiff }) {
  const { action, item, prevItem } = diff;

  const rowClass =
    action === "added"
      ? "bg-green-50 border-green-200"
      : action === "removed"
        ? "bg-red-50 border-red-200 line-through opacity-60"
        : "bg-yellow-50 border-yellow-200";

  const badge =
    action === "added" ? (
      <span className="rounded bg-green-100 px-1.5 py-0.5 text-[10px] font-semibold text-green-700">
        추가
      </span>
    ) : action === "removed" ? (
      <span className="rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-semibold text-red-700">
        삭제
      </span>
    ) : (
      <span className="rounded bg-yellow-100 px-1.5 py-0.5 text-[10px] font-semibold text-yellow-700">
        변경
      </span>
    );

  return (
    <>
      {/* changed: 이전 값 행 */}
      {action === "changed" && prevItem && (
        <tr className="border-t border-red-200 bg-red-50 opacity-60">
          <td className="px-3 py-1.5 text-center">
            <span className="rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-semibold text-red-700">
              이전
            </span>
          </td>
          <td className="px-3 py-1.5 line-through">
            {CATEGORY_LABELS[prevItem.category] ?? prevItem.category}
          </td>
          <td className="px-3 py-1.5 line-through">{prevItem.description}</td>
          <td className="px-3 py-1.5 text-right line-through">{prevItem.quantity}</td>
          <td className="px-3 py-1.5 text-right line-through">
            {prevItem.unitPrice.toLocaleString()}
          </td>
          <td className="px-3 py-1.5 text-right line-through">
            {prevItem.subtotal.toLocaleString()}
          </td>
        </tr>
      )}
      {/* 현재 값 행 */}
      <tr className={`border-t ${rowClass}`}>
        <td className="px-3 py-1.5 text-center">{badge}</td>
        <td className="px-3 py-1.5">
          {CATEGORY_LABELS[item.category] ?? item.category}
        </td>
        <td className="px-3 py-1.5">{item.description}</td>
        <td className="px-3 py-1.5 text-right">{item.quantity}</td>
        <td className="px-3 py-1.5 text-right">{item.unitPrice.toLocaleString()}</td>
        <td className="px-3 py-1.5 text-right font-medium">
          {item.subtotal.toLocaleString()}
        </td>
      </tr>
    </>
  );
}
