"use client";

// T-509: 버전 히스토리 패널 (사이드바)
// T-510: 구버전 클릭 → 읽기 전용 미리보기
// T-511: Diff 뷰어 연동
// T-514: 버전 2개 선택 비교 모드

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { ItineraryData, QuoteData } from "@/types";
import { KOREA_TIME_ZONE } from "@/lib/date/korea";
import { VersionComparisonPanel } from "./VersionComparisonPanel";

interface VersionMeta {
  id: string;
  versionNo: string;
  changeReason: string | null;
  savedAt: string;
  savedByRole: string;
  savedBy: { name: string };
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

interface Props {
  quoteId: string;
  latestVersion: string;
  onClose: () => void;
  /** 구버전 읽기 전용 미리보기 콜백 */
  onPreviewVersion: (version: VersionDetail) => void;
}

type ErrorResponse = {
  error?: string;
  message?: string;
};

async function readJsonOrThrow<T>(res: Response, fallbackMessage: string): Promise<T> {
  if (!res.ok) {
    let body: ErrorResponse = {};
    try {
      body = (await res.json()) as ErrorResponse;
    } catch {
      body = {};
    }
    throw new Error(body.message ?? body.error ?? fallbackMessage);
  }
  return res.json() as Promise<T>;
}

export function VersionHistory({
  quoteId,
  latestVersion,
  onClose,
  onPreviewVersion,
}: Props) {
  const [selectedVersion, setSelectedVersion] = useState<string | null>(null);
  const [compareVersions, setCompareVersions] = useState<string[]>([]);
  const [previewError, setPreviewError] = useState<string | null>(null);

  // 버전 목록 조회 (T-505)
  const { data, isLoading, error } = useQuery<{ versions: VersionMeta[] }>({
    queryKey: ["versions", quoteId],
    queryFn: async () => {
      const res = await fetch(`/api/quotes/${quoteId}/versions`);
      return readJsonOrThrow<{ versions: VersionMeta[] }>(
        res,
        "버전 목록을 불러오지 못했습니다."
      );
    },
  });

  // 기존 변경 비교 버튼 동작 호환 + 확장 비교용 상세 조회
  const compareTarget = compareVersions.length === 2 ? compareVersions : [];
  const {
    data: compareVersionsDetail,
    isLoading: isCompareLoading,
    error: compareError,
  } = useQuery<{ left: VersionDetail; right: VersionDetail }>({
    queryKey: ["version-compare", quoteId, compareTarget],
    queryFn: async () => {
      const [from, to] = compareVersions;
      const [fromRes, toRes] = await Promise.all([
        fetch(`/api/quotes/${quoteId}/versions/${from}`),
        fetch(`/api/quotes/${quoteId}/versions/${to}`),
      ]);

      const [left, right] = await Promise.all([
        readJsonOrThrow<VersionDetail>(fromRes, "버전 비교 데이터를 불러오지 못했습니다."),
        readJsonOrThrow<VersionDetail>(toRes, "버전 비교 데이터를 불러오지 못했습니다."),
      ]);

      return { left, right };
    },
    enabled: compareVersions.length === 2,
  });

  async function handleVersionClick(version: VersionMeta) {
    setSelectedVersion(version.versionNo);
    setCompareVersions([]);
    setPreviewError(null);

    try {
      const res = await fetch(
        `/api/quotes/${quoteId}/versions/${version.versionNo}`
      );
      const detail = await readJsonOrThrow<VersionDetail>(
        res,
        "버전 상세를 불러오지 못했습니다."
      );
      onPreviewVersion(detail);
    } catch (err) {
      setPreviewError(err instanceof Error ? err.message : "버전 상세를 불러오지 못했습니다.");
    }
  }

  function handleCompareToggle(versionNo: string) {
    const exists = compareVersions.includes(versionNo);
    if (exists) {
      setCompareVersions(compareVersions.filter((version) => version !== versionNo));
      setSelectedVersion(null);
      return;
    }

    if (compareVersions.length >= 2) {
      setCompareVersions([compareVersions[1], versionNo]);
      setSelectedVersion(null);
      return;
    }

    setCompareVersions([...compareVersions, versionNo]);
    setSelectedVersion(null);
  }

  function handleShowDiff(from: string, to: string) {
    setCompareVersions([from, to]);
    setSelectedVersion(null);
  }

  const versions = data?.versions ?? [];
  const isCompareActive = compareVersions.length === 2;
  const selectedCountText =
    compareVersions.length === 0
      ? "버전 선택"
      : `${compareVersions.length}개 선택 (${compareVersions.join(", ")})`;

  return (
    <div
      className="fixed inset-0 z-modal-backdrop flex items-start justify-end bg-[rgba(0,0,0,0.45)]"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="z-modal flex h-full w-full max-w-[98vw] flex-col overflow-hidden bg-background shadow-none lg:max-w-[1680px]">
        <div className="flex h-8 shrink-0 items-center justify-between gap-3 bg-chrome-sidebar px-3 text-chrome-sidebar-foreground">
          <span className="text-xs font-semibold">버전 이력</span>
          <div className="flex min-w-0 flex-1 items-center justify-center gap-2">
            <span className="truncate text-[11px] text-white/80">{selectedCountText}</span>
            <button
              type="button"
              onClick={() => setCompareVersions([])}
              className="shrink-0 rounded-erp border border-white/25 px-2 py-0.5 text-[10px] text-chrome-sidebar-foreground hover:bg-chrome-sidebar-hover"
            >
              비교 초기화
            </button>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="shrink-0 rounded-erp p-1 text-chrome-sidebar-foreground hover:bg-chrome-sidebar-hover"
          >
            ✕
          </button>
        </div>

        {/* 목록 */}
        <div className="flex-1 overflow-auto">
          {isLoading && (
            <p className="p-4 text-xs text-muted-foreground">불러오는 중...</p>
          )}
          {error && (
            <p className="p-4 text-xs text-destructive" role="alert">
              {error.message}
            </p>
          )}
          {previewError && (
            <p className="p-4 text-xs text-destructive" role="alert">
              {previewError}
            </p>
          )}
          {!isLoading && versions.length === 0 && (
            <p className="p-4 text-xs text-muted-foreground">저장된 버전이 없습니다.</p>
          )}

          <ul className="divide-y divide-border">
            {versions.map((v, idx) => {
              const isLatest = v.versionNo === latestVersion;
              const prevVersion = versions[idx + 1]?.versionNo;
              const isCompareChecked = compareVersions.includes(v.versionNo);

              return (
                <li
                  key={v.id}
                  className={`p-4 transition-colors hover:bg-muted/30 ${selectedVersion === v.versionNo ? "bg-muted/50" : ""}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-sm font-semibold text-foreground">
                          {v.versionNo}
                        </span>
                        {isLatest && (
                          <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                            최신
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        {formatDate(v.savedAt)} · {v.savedBy.name} (
                        {roleLabel(v.savedByRole)})
                      </p>
                      {v.changeReason && (
                        <p className="mt-1 text-[11px] text-foreground line-clamp-2">
                          {v.changeReason}
                        </p>
                      )}
                    </div>

                    <div className="flex shrink-0 flex-col gap-1">
                      <label className="mb-1 flex cursor-pointer items-center gap-1 text-[11px] text-muted-foreground">
                        <input
                          type="checkbox"
                          checked={isCompareChecked}
                          onChange={() => handleCompareToggle(v.versionNo)}
                          className="h-3.5 w-3.5"
                        />
                        <span>비교 선택</span>
                      </label>
                      {/* 미리보기 버튼 */}
                      <button
                        onClick={() => handleVersionClick(v)}
                        className="rounded border border-border px-2 py-1 text-[10px] font-medium text-foreground hover:bg-muted"
                      >
                        미리보기
                      </button>
                      {/* Diff 버튼 (이전 버전이 있을 때) */}
                      {prevVersion && (
                        <button
                          onClick={() => handleShowDiff(prevVersion, v.versionNo)}
                          className="rounded border border-border px-2 py-1 text-[10px] font-medium text-foreground hover:bg-muted"
                        >
                          변경 비교
                        </button>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>

          {/* Diff/비교 패널 */}
          {isCompareActive && (
            <div className="border-t border-border p-4">
              {isCompareLoading && (
                <p className="text-xs text-muted-foreground">비교 계산 중...</p>
              )}
              {compareError && (
                <p className="text-xs text-destructive">
                  {compareError.message}
                </p>
              )}
              {compareVersionsDetail && (
                <VersionComparisonPanel
                  leftVersion={compareVersionsDetail.left}
                  rightVersion={compareVersionsDetail.right}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("ko-KR", {
    timeZone: KOREA_TIME_ZONE,
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function roleLabel(role: string) {
  const map: Record<string, string> = {
    PARTNER: "협력사",
    AGENT: "견적담당",
    SALES: "영업담당",
  };
  return map[role] ?? role;
}
