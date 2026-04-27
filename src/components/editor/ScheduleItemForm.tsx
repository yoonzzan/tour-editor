"use client";

// T-308: ScheduleItem 유형별 입력 폼
// TRANSFER / SIGHTSEEING / MEAL / ACCOMMODATION / OTHER

import type { MealSlot, ScheduleItem, ScheduleItemType } from "@/types";
import type { ReactElement, ReactNode } from "react";
import {
  mealSlotLabel,
  MEAL_SLOTS,
  MEAL_SLOT_KEYS,
  resolveMealValues,
} from "@/lib/itinerary/meal";

interface Props {
  item: ScheduleItem;
  onChange: (updated: ScheduleItem) => void;
  onRemove: () => void;
  /** 드래그 핸들 — DayBlock에서 주입 */
  dragHandle?: ReactNode;
}

const TYPE_COLORS: Record<ScheduleItem["type"], string> = {
  TRANSFER: "bg-blue-100 text-blue-700",
  SIGHTSEEING: "bg-green-100 text-green-700",
  MEAL: "bg-orange-100 text-orange-700",
  ACCOMMODATION: "bg-purple-100 text-purple-700",
  OTHER: "bg-gray-100 text-gray-600",
};

const ITEM_TYPE_OPTIONS: Array<{ type: ScheduleItemType; label: string }> = [
  { type: "TRANSFER", label: "이동" },
  { type: "SIGHTSEEING", label: "관광" },
  { type: "MEAL", label: "식사" },
  { type: "ACCOMMODATION", label: "숙박" },
  { type: "OTHER", label: "기타" },
];

export function ScheduleItemForm({ item, onChange, onRemove, dragHandle }: Props) {
  const patch = (partial: Partial<ScheduleItem>) =>
    onChange({ ...item, ...partial });

  const isMeal = item.type === "MEAL";
  const isAccommodation = item.type === "ACCOMMODATION";
  const regionValue = item.region ?? "";
  const transportValue = item.transport ?? "";
  const timeValue = item.time ?? "";
  const detailValue = item.detail ?? "";
  const resolvedMeal = resolveMealValues({ meal: item.meal, content: item.content });
  const inferredMealSlot = MEAL_SLOT_KEYS.find((slot) =>
    Boolean(resolvedMeal[slot])
  );
  const mealSlot: MealSlot = item.mealSlot ?? inferredMealSlot ?? "breakfast";

  function getMealValue(): string {
    const value = resolvedMeal[mealSlot];
    return value ?? "";
  }

  function handleMealSlotChange(slot: MealSlot): void {
    patch({ mealSlot: slot });
  }

  function handleMealContentChange(content: string): void {
    patch({
      meal: {
        ...item.meal,
        [mealSlot]: content || undefined,
      },
    });
  }

  function normalizeItemType(nextType: ScheduleItemType): ScheduleItem {
    const baseContent = isMeal
      ? resolvedMeal[mealSlot] || item.content
      : item.content;
    if (nextType === "MEAL") {
      const nextSlot: MealSlot = item.mealSlot ?? "breakfast";
      const nextContent = resolvedMeal[mealSlot] || item.content;
      const withoutDetail = { ...item };
      delete withoutDetail.detail;
      return {
        ...withoutDetail,
        type: "MEAL",
        mealSlot: nextSlot,
        content: nextContent || baseContent,
        meal: {
          ...(item.meal ?? {}),
          [nextSlot]: nextContent || baseContent,
        },
      };
    }

    const toAccommodation = nextType === "ACCOMMODATION";
    const mealSource = resolvedMeal.breakfast || resolvedMeal.lunch || resolvedMeal.dinner || baseContent;
    const content = item.hotel || mealSource || item.content;
    const withoutMeal: Omit<ScheduleItem, "meal" | "mealSlot"> = {
      ...(item as Omit<ScheduleItem, "meal" | "mealSlot">),
      type: nextType,
      content,
    };
    if (item.type === "MEAL" && (item.content || item.meal)) {
      withoutMeal.content = content;
    }

    if (toAccommodation) {
      return { ...withoutMeal, hotel: content };
    }

    if (item.type === "ACCOMMODATION" || isAccommodation) {
      return withoutMeal;
    }

    return withoutMeal;
  }

  function handleTypeChange(nextType: ScheduleItemType): void {
    patch(normalizeItemType(nextType));
  }

  function renderTypeInput(): ReactElement {
    return (
      <label className="flex flex-col gap-0.5 md:col-span-2">
        <span className={responsiveLabelClass}>항목구분</span>
        <select
          aria-label="항목구분"
          value={item.type}
          onChange={(e) => handleTypeChange(e.target.value as ScheduleItemType)}
          className={`h-8 rounded border border-input bg-transparent px-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring ${TYPE_COLORS[item.type]}`}
        >
          {ITEM_TYPE_OPTIONS.map(({ type, label }) => (
            <option key={type} value={type}>
              {label}
            </option>
          ))}
        </select>
      </label>
    );
  }

  const responsiveLabelClass = "text-xs text-muted-foreground md:sr-only";

  return (
    <div
      className="group relative flex gap-2 rounded-md border border-border bg-background p-3"
      data-item-type={item.type}
    >
      <div
        className={`flex w-4 items-start justify-center pt-0.5 ${
          dragHandle ? "cursor-grab text-muted-foreground hover:text-foreground" : ""
        }`}
        aria-hidden={!dragHandle}
      >
        {dragHandle ?? <span className="invisible select-none">⠿</span>}
      </div>

      <div className="flex-1 pr-8">
        <button
          onClick={onRemove}
          aria-label="항목 삭제"
          className="absolute right-3 top-3 inline-flex h-8 w-7 items-center justify-center rounded p-0.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
        >
          ✕
        </button>

        {isMeal ? (
          <div className="grid grid-cols-1 gap-2 md:grid-cols-12 md:items-start">
            {renderTypeInput()}

            <Field
              id={`${item.id}-region`}
              label="지역"
              value={regionValue}
              onChange={(v) => patch({ region: v })}
              placeholder="예: 싱가포르"
              className="md:col-span-1"
            />

            <Field
              id={`${item.id}-transport`}
              label="교통편"
              value={transportValue}
              onChange={(v) => patch({ transport: v })}
              placeholder="예: 항공"
              className="md:col-span-1"
            />

            <Field
              id={`${item.id}-time`}
              label="시간"
              value={timeValue}
              onChange={(v) => patch({ time: v })}
              placeholder="예: 10:30"
              className="md:col-span-1"
            />

            <div className="flex flex-col gap-0.5 md:col-span-7">
              <label htmlFor={`${item.id}-meal`} className={responsiveLabelClass}>
                내용
              </label>
              <div className="flex gap-1">
                <label htmlFor={`${item.id}-meal-slot`} className="sr-only">
                  식사 구분
                </label>
                <select
                  id={`${item.id}-meal-slot`}
                  aria-label="식사 구분"
                  value={mealSlot}
                  onChange={(e) => handleMealSlotChange(e.target.value as MealSlot)}
                  className="h-8 w-24 shrink-0 rounded border border-input bg-transparent px-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  {MEAL_SLOTS.map((slot) => (
                    <option key={slot.key} value={slot.key}>
                      {mealSlotLabel(slot.key)}
                    </option>
                  ))}
                </select>
                <input
                  id={`${item.id}-meal`}
                  type="text"
                  value={getMealValue()}
                  onChange={(e) => handleMealContentChange(e.target.value)}
                  placeholder={`${mealSlotLabel(mealSlot)} 입력`}
                  className="h-8 w-full rounded border border-input bg-transparent px-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-2 md:grid-cols-12 md:items-start">
            {/* 항목구분 */}
            {renderTypeInput()}

            <Field
              id={`${item.id}-region`}
              label="지역"
              value={regionValue}
              onChange={(v) => patch({ region: v })}
              placeholder="예: 싱가포르"
              className="md:col-span-1"
            />

            <Field
              id={`${item.id}-transport`}
              label="교통편"
              value={transportValue}
              onChange={(v) => patch({ transport: v })}
              placeholder="예: 항공"
              className="md:col-span-1"
            />

            <Field
              id={`${item.id}-time`}
              label="시간"
              value={timeValue}
              onChange={(v) => patch({ time: v })}
              placeholder="예: 10:30"
              className="md:col-span-1"
            />

            {isAccommodation ? (
              <>
                <Field
                  id={`${item.id}-content`}
                  label="내용"
                  value={item.hotel ?? item.content}
                  onChange={(v) =>
                    patch({ hotel: v, content: v })
                  }
                  placeholder="호텔명 입력"
                  className="md:col-span-3"
                />
                <Field
                  id={`${item.id}-detail`}
                  label="상세"
                  value={detailValue}
                  onChange={(v) => patch({ detail: v })}
                  placeholder="상세 입력"
                  className="md:col-span-4"
                />
              </>
            ) : (
              <>
                <Field
                  id={`${item.id}-content`}
                  label="내용"
                  value={item.content}
                  onChange={(v) => patch({ content: v })}
                  placeholder="내용 입력"
                  className="md:col-span-3"
                />
                <Field
                  id={`${item.id}-detail`}
                  label="상세"
                  value={detailValue}
                  onChange={(v) => patch({ detail: v })}
                  placeholder="상세 입력"
                  className="md:col-span-4"
                />
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── 공통 인풋 서브컴포넌트 ───────────────────────────────

type FieldProps = {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
};

function Field({
  id,
  label,
  value,
  onChange,
  placeholder,
  className = "",
}: FieldProps) {
  return (
    <div className={`flex flex-col gap-0.5 ${className}`}>
      <label htmlFor={id} className="text-xs text-muted-foreground md:sr-only">
        {label}
      </label>
      <input
        id={id}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-8 w-full rounded border border-input bg-transparent px-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
      />
    </div>
  );
}
