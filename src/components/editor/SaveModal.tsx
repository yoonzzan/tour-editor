"use client";

// T-508: 저장 버튼 클릭 → 변경 사유 입력 모달

import { useState } from "react";

interface Props {
  onSave: (changeReason: string) => Promise<void>;
  onClose: () => void;
}

export function SaveModal({ onSave, onClose }: Props) {
  const [reason, setReason] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    try {
      await onSave(reason.trim());
    } catch (err) {
      setError(err instanceof Error ? err.message : "저장에 실패했습니다.");
      setIsSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-modal-backdrop flex items-center justify-center bg-[rgba(0,0,0,0.45)]"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSaving) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        className="z-modal w-96 overflow-hidden rounded-md border border-border bg-background shadow-none"
      >
        <div className="flex h-8 shrink-0 items-center justify-between bg-chrome-sidebar px-3 text-chrome-sidebar-foreground">
          <span className="text-xs font-semibold">버전 저장</span>
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            aria-label="닫기"
            className="rounded-erp p-1 text-chrome-sidebar-foreground hover:bg-chrome-sidebar-hover disabled:opacity-50"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-4">
          <div>
            <label
              htmlFor="changeReason"
              className="mb-1.5 block text-xs font-medium text-foreground"
            >
              변경 사유 <span className="text-muted-foreground">(선택)</span>
            </label>
            <textarea
              id="changeReason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="예) 숙박 업그레이드 반영, 항공 스케줄 변경..."
              rows={3}
              disabled={isSaving}
              className="h-20 w-full resize-none rounded-erp border border-input bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50"
            />
          </div>

          {error && (
            <p role="alert" className="text-xs text-destructive">
              {error}
            </p>
          )}

          <div className="flex justify-between gap-2 border-t border-border bg-background pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="h-7 rounded-erp border border-border px-4 text-xs font-medium text-foreground hover:bg-muted disabled:opacity-50"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="h-7 rounded-erp bg-primary px-4 text-xs font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
            >
              {isSaving ? "저장 중..." : "저장"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
