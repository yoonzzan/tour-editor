// src/lib/itinerary/mutations.ts
// 일정 항목 추가·삭제·순서 변경·일차 이동 순수 함수
// T-309: 동일 구분 여러 개 허용 (제한 로직 없음)
// T-310: ACCOMMODATION은 항상 해당 일차 마지막에 위치

import { v4 as uuidv4 } from "uuid";
import type { DaySchedule, ScheduleItem, ScheduleItemType } from "@/types";

/** 유형별 기본값 */
function defaultItem(type: ScheduleItemType): ScheduleItem {
  const base = { id: uuidv4(), type, content: "" };
  switch (type) {
    case "TRANSFER":
      return { ...base, region: "", transport: "", time: "" };
    case "SIGHTSEEING":
      return { ...base, region: "" };
    case "MEAL":
      return { ...base, mealSlot: "breakfast", meal: {} };
    case "ACCOMMODATION":
      return { ...base, hotel: "", region: "" };
    case "OTHER":
      return base;
  }
}

/**
 * T-310: ACCOMMODATION을 항상 마지막으로 재배치한다.
 * 숙박이 없거나 이미 마지막이면 그대로.
 */
function stabilizeAccommodation(items: ScheduleItem[]): ScheduleItem[] {
  const acc = items.filter((i) => i.type === "ACCOMMODATION");
  const rest = items.filter((i) => i.type !== "ACCOMMODATION");
  return [...rest, ...acc];
}

/** 특정 일차에 항목 추가 (T-307/309) */
export function addItemToDay(
  days: DaySchedule[],
  dayIndex: number,
  type: ScheduleItemType
): DaySchedule[] {
  return days.map((day, i) => {
    if (i !== dayIndex) return day;
    const newItems = stabilizeAccommodation([...day.items, defaultItem(type)]);
    return { ...day, items: newItems };
  });
}

/** 특정 일차에서 항목 삭제 */
export function removeItemFromDay(
  days: DaySchedule[],
  dayIndex: number,
  itemId: string
): DaySchedule[] {
  return days.map((day, i) => {
    if (i !== dayIndex) return day;
    return { ...day, items: day.items.filter((item) => item.id !== itemId) };
  });
}

/** 같은 일차 내 순서 변경 (T-311) — activeId를 overIndex 위치로 이동 */
export function reorderItemInDay(
  days: DaySchedule[],
  dayIndex: number,
  activeId: string,
  overId: string
): DaySchedule[] {
  return days.map((day, i) => {
    if (i !== dayIndex) return day;
    const items = [...day.items];
    const activeIdx = items.findIndex((it) => it.id === activeId);
    const overIdx = items.findIndex((it) => it.id === overId);
    if (activeIdx === -1 || overIdx === -1) return day;
    const [moved] = items.splice(activeIdx, 1);
    items.splice(overIdx, 0, moved);
    return { ...day, items: stabilizeAccommodation(items) };
  });
}

/** 다른 일차로 항목 이동 (T-312) */
export function moveItemBetweenDays(
  days: DaySchedule[],
  fromDayIndex: number,
  toDayIndex: number,
  itemId: string
): DaySchedule[] {
  const item = days[fromDayIndex]?.items.find((it) => it.id === itemId);
  if (!item) return days;

  return days.map((day, i) => {
    if (i === fromDayIndex) {
      return { ...day, items: day.items.filter((it) => it.id !== itemId) };
    }
    if (i === toDayIndex) {
      return {
        ...day,
        items: stabilizeAccommodation([...day.items, item]),
      };
    }
    return day;
  });
}

/** 일차 블록 순서 변경 */
export function reorderDays(
  days: DaySchedule[],
  activeDayNo: number,
  overDayNo: number
): DaySchedule[] {
  const fromIndex = days.findIndex((day) => day.dayNo === activeDayNo);
  const toIndex = days.findIndex((day) => day.dayNo === overDayNo);
  if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) return days;

  const reordered = [...days];
  const [moved] = reordered.splice(fromIndex, 1);
  if (!moved) return days;
  reordered.splice(toIndex, 0, moved);

  return reordered.map((day, index) => ({
    ...day,
    dayNo: index + 1,
  }));
}
