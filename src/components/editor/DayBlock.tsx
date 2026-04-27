"use client";

// T-306: DayBlock 컴포넌트 (일차 헤더 + 항목 목록)
// T-307: 항목 추가 버튼 → 유형 선택 드롭다운
// T-311: @dnd-kit/core 드래그앤드롭 (같은 일차 내)

import { useState, type ReactNode } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { DaySchedule, ScheduleItem, ScheduleItemType } from "@/types";
import { ScheduleItemForm } from "./ScheduleItemForm";

const ITEM_TYPES: { type: ScheduleItemType; label: string }[] = [
  { type: "TRANSFER", label: "이동" },
  { type: "SIGHTSEEING", label: "관광" },
  { type: "MEAL", label: "식사" },
  { type: "ACCOMMODATION", label: "숙박" },
  { type: "OTHER", label: "기타" },
];

interface Props {
  day: DaySchedule;
  onUpdateDay: (updated: DaySchedule) => void;
  onAddItem: (type: ScheduleItemType) => void;
  onRemoveItem: (itemId: string) => void;
  onClearDay: () => void;
  onReorder: (activeId: string, overId: string) => void;
  dayDragHandle?: ReactNode;
}

export function DayBlock({
  day,
  onUpdateDay,
  onAddItem,
  onRemoveItem,
  onClearDay,
  onReorder,
  dayDragHandle,
}: Props) {
  const [showTypeMenu, setShowTypeMenu] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    onReorder(String(active.id), String(over.id));
  }

  function handleItemChange(updated: ScheduleItem) {
    const newItems = day.items.map((it) => (it.id === updated.id ? updated : it));
    const prevType = day.items.find((item) => item.id === updated.id)?.type;
    const needsReorder =
      updated.type === "ACCOMMODATION" ||
      prevType === "ACCOMMODATION" ||
      prevType === undefined;
    onUpdateDay({
      ...day,
      items: needsReorder ? stabilizeAccommodationOrder(newItems) : newItems,
    });
  }

  // 숙박 외 항목만 드래그 가능 (T-311, ACCOMMODATION: isDraggable = false)
  const draggableIds = day.items
    .filter((it) => it.type !== "ACCOMMODATION")
    .map((it) => it.id);

  return (
    <div className="rounded-lg border border-border bg-card" data-testid={`day-block-${day.dayNo}`}>
      {/* 일차 헤더 */}
      <div className="flex items-center gap-3 border-b border-border px-4 py-2.5">
        {dayDragHandle && (
          <div className="cursor-grab text-muted-foreground hover:text-foreground">
            {dayDragHandle}
          </div>
        )}
        <span className="min-w-[4rem] text-sm font-semibold text-foreground">
          {day.dayNo}일차
        </span>
        <input
          type="date"
          aria-label={`${day.dayNo}일차 날짜`}
          value={day.date}
          onChange={(e) => onUpdateDay({ ...day, date: e.target.value })}
          className="rounded border border-input bg-transparent px-2 py-0.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
        />
        <span className="ml-auto text-xs text-muted-foreground">
          {day.items.length}개 항목
        </span>
        <button
          type="button"
          disabled={day.items.length === 0}
          onClick={() => {
            if (day.items.length === 0) return;
            if (!window.confirm(`${day.dayNo}일차의 모든 항목을 삭제할까요?`)) return;
            onClearDay();
          }}
          className="rounded-md border border-border px-2 py-1 text-xs text-muted-foreground hover:border-destructive hover:text-destructive disabled:cursor-not-allowed disabled:opacity-40"
        >
          내용 전체삭제
        </button>
      </div>

      {/* 항목 목록 */}
      <div className="flex flex-col gap-2 p-3">
        <div className="hidden md:grid md:grid-cols-12 md:items-center md:gap-2 md:px-7">
          <span className="md:col-span-2 text-center text-xs text-muted-foreground">항목구분</span>
          <span className="md:col-span-1 text-center text-xs text-muted-foreground">지역</span>
          <span className="md:col-span-1 text-center text-xs text-muted-foreground">교통편</span>
          <span className="md:col-span-1 text-center text-xs text-muted-foreground">시간</span>
          <span className="md:col-span-3 text-center text-xs text-muted-foreground">내용</span>
          <span className="md:col-span-4 text-center text-xs text-muted-foreground">상세</span>
        </div>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={draggableIds}
            strategy={verticalListSortingStrategy}
          >
            {day.items.map((item) => (
              <SortableItem
                key={item.id}
                item={item}
                isDraggable={item.type !== "ACCOMMODATION"}
                onChange={handleItemChange}
                onRemove={() => onRemoveItem(item.id)}
              />
            ))}
          </SortableContext>
        </DndContext>

        {day.items.length === 0 && (
          <p className="py-4 text-center text-xs text-muted-foreground">
            항목이 없습니다. 아래 버튼으로 추가하세요.
          </p>
        )}
      </div>

      {/* 항목 추가 (T-307) */}
      <div className="relative border-t border-border px-3 py-2.5">
        <button
          onClick={() => setShowTypeMenu((v) => !v)}
          className="flex items-center gap-1.5 rounded-md border border-dashed border-border px-3 py-1.5 text-xs text-muted-foreground hover:border-primary hover:text-primary"
        >
          <span>+</span>
          <span>항목 추가</span>
        </button>

        {showTypeMenu && (
          <div className="absolute left-3 top-12 z-10 flex flex-col rounded-md border border-border bg-background shadow-md">
            {ITEM_TYPES.map(({ type, label }) => (
              <button
                key={type}
                className="px-4 py-2 text-left text-sm hover:bg-muted"
                onClick={() => {
                  onAddItem(type);
                  setShowTypeMenu(false);
                }}
              >
                {label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Sortable 항목 래퍼 ───────────────────────────────────

interface SortableItemProps {
  item: ScheduleItem;
  isDraggable: boolean;
  onChange: (updated: ScheduleItem) => void;
  onRemove: () => void;
}

function SortableItem({
  item,
  isDraggable,
  onChange,
  onRemove,
}: SortableItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: item.id, disabled: !isDraggable });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const dragHandle = isDraggable ? (
    <span
      {...attributes}
      {...listeners}
      aria-label="드래그하여 순서 변경"
      className="select-none text-muted-foreground"
      title="드래그하여 순서 변경"
    >
      ⠿
    </span>
  ) : null;

  return (
    <div ref={setNodeRef} style={style} className="flex flex-col gap-1">
      <ScheduleItemForm
        item={item}
        onChange={onChange}
        onRemove={onRemove}
        dragHandle={dragHandle}
      />
    </div>
  );
}

function stabilizeAccommodationOrder(items: ScheduleItem[]): ScheduleItem[] {
  const accommodations = items.filter((item) => item.type === "ACCOMMODATION");
  const others = items.filter((item) => item.type !== "ACCOMMODATION");
  return [...others, ...accommodations];
}
