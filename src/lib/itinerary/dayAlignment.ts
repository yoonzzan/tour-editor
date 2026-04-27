import type { DaySchedule, ItineraryData } from "@/types";
import { dateStringInKorea } from "@/lib/date/korea";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/u;
const DATE_RE_FLEX = /^\d{4}-(\d{1,2})-(\d{1,2})$/u;
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

function normalizeDate(value: string): string | null {
  const trimmed = value.trim();
  if (DATE_RE.test(trimmed)) return trimmed;

  const compact = trimmed.replace(/[./\s]/gu, "-");
  const isoDate = /^\d{4}-\d{1,2}-\d{1,2}(?:[T\s].*)?$/u.exec(compact);
  if (isoDate?.[0]) {
    const [dateOnly] = isoDate[0].split(/[T\s]/u);
    const flexDate = DATE_RE_FLEX.exec(dateOnly);
    if (flexDate?.[1] && flexDate[2]) {
      return `${dateOnly.slice(0, 4)}-${flexDate[1].padStart(2, "0")}-${flexDate[2].padStart(2, "0")}`;
    }
  }

  const flex = DATE_RE_FLEX.exec(compact);
  if (flex?.[1] && flex[2]) {
    return `${compact.slice(0, 4)}-${flex[1].padStart(2, "0")}-${flex[2].padStart(2, "0")}`;
  }

  const loose = /(\d{4})-(\d{1,2})-(\d{1,2})/u.exec(compact);
  if (loose?.[1] && loose[2] && loose[3]) {
    return `${loose[1].padStart(4, "0")}-${loose[2].padStart(2, "0")}-${loose[3].padStart(2, "0")}`;
  }

  const date = new Date(compact);
  if (Number.isNaN(date.getTime())) return null;
  const normalized = dateStringInKorea(date);
  return DATE_RE.test(normalized) ? normalized : null;
}

function parseDate(value: string): Date | null {
  const normalized = normalizeDate(value);
  if (!normalized) return null;
  const [yearRaw, monthRaw, dayRaw] = normalized.split("-").map(Number);
  const year = yearRaw ?? 0;
  const month = monthRaw ?? 0;
  const day = dayRaw ?? 0;
  if (!year || !month || !day) return null;
  const date = new Date(Date.UTC(year, month - 1, day));
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

export function addDaysToDateString(baseDate: string, offset: number): string {
  const parsed = parseDate(baseDate);
  if (!parsed) return baseDate;
  const date = new Date(parsed.getTime() + offset * ONE_DAY_MS);
  return dateStringInKorea(date);
}

export function getTravelDayCount(period: ItineraryData["overview"]["travelPeriod"]): number | null {
  const start = parseDate(period.start);
  const end = parseDate(period.end);
  if (!start || !end) return null;
  const diff = Math.round((end.getTime() - start.getTime()) / ONE_DAY_MS);
  if (diff < 0) return null;
  return diff + 1;
}

function normalizeDay(day: DaySchedule, startDate: string): DaySchedule {
  return {
    ...day,
    date: day.date || addDaysToDateString(startDate, day.dayNo - 1),
  };
}

export function alignDaysToTravelPeriod(itinerary: ItineraryData): {
  itinerary: ItineraryData;
  expectedDayCount: number | null;
  hasOutOfRangeContent: boolean;
  outOfRangeDayNos: number[];
} {
  const expectedDayCount = getTravelDayCount(itinerary.overview.travelPeriod);
  if (!expectedDayCount) {
    return {
      itinerary,
      expectedDayCount,
      hasOutOfRangeContent: false,
      outOfRangeDayNos: [],
    };
  }

  const startDate = itinerary.overview.travelPeriod.start;
  const byDayNo = new Map<number, DaySchedule>();
  for (const day of itinerary.days) {
    const existing = byDayNo.get(day.dayNo);
    if (!existing) {
      byDayNo.set(day.dayNo, normalizeDay(day, startDate));
      continue;
    }
    byDayNo.set(day.dayNo, {
      ...existing,
      items: [...existing.items, ...day.items],
      date: existing.date || day.date || addDaysToDateString(startDate, day.dayNo - 1),
    });
  }

  const normalizedDays: DaySchedule[] = [];
  for (let dayNo = 1; dayNo <= expectedDayCount; dayNo += 1) {
    const existing = byDayNo.get(dayNo);
    normalizedDays.push(
      existing ?? {
        dayNo,
        date: addDaysToDateString(startDate, dayNo - 1),
        items: [],
      },
    );
  }

  const outOfRangeDays = Array.from(byDayNo.values())
    .filter((day) => day.dayNo > expectedDayCount)
    .sort((a, b) => a.dayNo - b.dayNo);
  const outOfRangeDayNos = outOfRangeDays
    .filter((day) => day.items.length > 0)
    .map((day) => day.dayNo);

  return {
    itinerary: {
      ...itinerary,
      days: [...normalizedDays, ...outOfRangeDays],
    },
    expectedDayCount,
    hasOutOfRangeContent: outOfRangeDayNos.length > 0,
    outOfRangeDayNos,
  };
}
