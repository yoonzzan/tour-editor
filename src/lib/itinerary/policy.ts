import type { DaySchedule, ItineraryData, ScheduleItem } from "@/types";

function stabilizeAccommodation(items: ScheduleItem[]): ScheduleItem[] {
  const accommodations = items.filter((item) => item.type === "ACCOMMODATION");
  const others = items.filter((item) => item.type !== "ACCOMMODATION");
  return [...others, ...accommodations];
}

export function enforceAccommodationLast(days: DaySchedule[]): DaySchedule[] {
  return days.map((day) => ({
    ...day,
    items: stabilizeAccommodation(day.items),
  }));
}

export function enforceAccommodationPolicy(itinerary: ItineraryData): ItineraryData {
  return {
    ...itinerary,
    days: enforceAccommodationLast(itinerary.days),
  };
}
