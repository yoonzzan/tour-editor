import type { DaySchedule, ItineraryData, MealSlot, ScheduleItem, ScheduleItemType } from "@/types";
import { enforceAccommodationLast } from "@/lib/itinerary/policy";
import { dateStringInKorea, todayInKorea } from "@/lib/date/korea";
import { splitMcpScheduleContent } from "@/lib/itinerary/contentDetail";

type UnknownRecord = Record<string, unknown>;

type ItineraryPayload = {
  code: string;
  name: string;
  itinerary: ItineraryData;
};

const CURRENT_DATE = todayInKorea();

const TYPE_ORDER_HINT = {
  transfer: ["transfer", "이동", "항공", "항차", "교통", "차량", "vehicle", "transport", "air", "flight"],
  sightseeing: ["sightseeing", "관광", "액티", "투어", "관람", "city", "attraction", "tour", "sight", "골프", "선택관광"],
  meal: ["meal", "식사", "조식", "중식", "석식", "식권", "다이닝", "dining", "breakfast", "lunch", "dinner"],
  accommodation: ["accommodation", "숙박", "호텔", "stay", "객실", "리조트", "villa"],
  other: ["other", "기타", "custom", "텍스트입력", "자유일정"],
} as const;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null;
}

function asString(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const text = value.trim();
  return text.length > 0 ? text : undefined;
}

function asNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value.replace(/,/g, "").trim());
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

function pickFirstString(root: UnknownRecord, keys: string[]): string | undefined {
  for (const key of keys) {
    const value = asString(root[key]);
    if (value) return value;
  }
  return undefined;
}

function pickFirstNumber(root: UnknownRecord, keys: string[]): number | undefined {
  for (const key of keys) {
    const parsed = asNumber(root[key]);
    if (parsed !== undefined) return parsed;
  }
  return undefined;
}

function pickFirstRecord(
  root: UnknownRecord,
  keys: string[],
): UnknownRecord | undefined {
  for (const key of keys) {
    const value = root[key];
    if (isRecord(value)) return value;
  }
  return undefined;
}

function pickFirstArray(root: UnknownRecord, keys: string[]): unknown[] | undefined {
  for (const key of keys) {
    const value = root[key];
    if (Array.isArray(value)) return value;
  }
  return undefined;
}

function sanitizeText(value: unknown): string {
  return asString(value)
    ?.replace(/<[^>]*>/g, " ")
    ?.replace(/\r\n/g, "\n")
    ?.replace(/&nbsp;/g, " ")
    ?.replace(/\s+/g, " ")
    ?.trim() ?? "";
}

function shortText(value: unknown, max = 220): string {
  const text = sanitizeText(value);
  if (!text) return "";
  return text.length <= max ? text : `${text.slice(0, max)}...`;
}

function normalizeComparableText(value: string): string {
  return value
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, "")
    .replace(/[()[\]{}「」『』·.,:：;；\-_/]/g, "")
    .toLowerCase();
}

function uniqueByText(values: Array<string | undefined>): string[] {
  const normalized = values
    .map((entry) => asString(entry))
    .filter((entry): entry is string => typeof entry === "string" && entry.length > 0);
  return Array.from(new Set(normalized));
}

function nonFlagText(value: string | undefined): string {
  const text = asString(value);
  if (!text) return "";
  return /^[YN]$/iu.test(text) ? "" : text;
}

function toDateString(date: Date): string {
  return dateStringInKorea(date);
}

function normalizeDateFromTimestamp(value: number): string {
  const normalized = Math.trunc(value);
  if (Number.isNaN(normalized) || !Number.isFinite(normalized)) return "";

  const asText = `${normalized}`;
  let millis = normalized;
  if (asText.length === 10) {
    millis = normalized * 1000;
  }
  const date = new Date(millis);
  if (Number.isNaN(date.getTime())) return "";
  return toDateString(date);
}

function normalizeDateFromText(text: string): string {
  const normalized = text.trim();
  if (!normalized) return "";

  const compact = normalized.replace(/[./\s]/gu, "-");
  const m1 = /^([0-9]{4})-([0-9]{1,2})-([0-9]{1,2})$/u.exec(compact);
  if (m1) {
    const [, yearRaw, monthRaw, dayRaw] = m1;
    if (yearRaw && monthRaw && dayRaw) {
      return `${yearRaw.padStart(4, "0")}-${monthRaw.padStart(2, "0")}-${dayRaw.padStart(2, "0")}`;
    }
  }

  const loose = /([0-9]{4})-([0-9]{1,2})-([0-9]{1,2})/u.exec(compact);
  if (loose) {
    const [, yearRaw, monthRaw, dayRaw] = loose;
    if (yearRaw && monthRaw && dayRaw) {
      return `${yearRaw.padStart(4, "0")}-${monthRaw.padStart(2, "0")}-${dayRaw.padStart(2, "0")}`;
    }
  }

  const digitsOnly = normalized.replace(/[^0-9]/g, "");
  if (/^[0-9]{8}$/.test(digitsOnly)) {
    return `${digitsOnly.slice(0, 4)}-${digitsOnly.slice(4, 6)}-${digitsOnly.slice(6, 8)}`;
  }

  if (/^[0-9]{10}$/.test(digitsOnly) || /^[0-9]{13}$/.test(digitsOnly)) {
    return normalizeDateFromTimestamp(Number(digitsOnly));
  }

  const parsed = new Date(normalized);
  if (!Number.isNaN(parsed.getTime())) return toDateString(parsed);
  return "";
}

function normalizeDate(value: unknown): string {
  if (typeof value === "number" && Number.isFinite(value)) {
    return normalizeDateFromText(`${Math.trunc(value)}`);
  }

  const text = asString(value);
  if (!text) return "";
  return normalizeDateFromText(text);
}

function normalizeTimeValue(hourRaw: unknown, minuteRaw?: unknown): string {
  const hour = asString(hourRaw);
  const minute = asString(minuteRaw);

  if (hour?.includes(":")) {
    const [hh, mm] = hour.split(":").map((value) => value.trim());
    if (hh && mm) return `${hh.padStart(2, "0")}:${mm.padStart(2, "0")}`;
    if (hh) return hh.padStart(2, "0");
  }

  if (!hour) return "";
  const mm = asString(minute);
  const normalizedHour = hour.trim();
  const normalizedMinute = mm?.trim() ?? "";

  if (normalizedHour.length === 4 && /^\d{4}$/.test(normalizedHour)) {
    const hh = normalizedHour.slice(0, 2);
    const mmPart = normalizedHour.slice(2, 4);
    return `${hh.padStart(2, "0")}:${mmPart.padStart(2, "0")}`;
  }

  if (!normalizedMinute || normalizedMinute === "0" || normalizedMinute === "00") {
    return normalizedHour.padStart(2, "0");
  }

  return `${normalizedHour.padStart(2, "0")}:${normalizedMinute.padStart(2, "0")}`;
}

function normalizeAndFillDayDates(
  days: DaySchedule[],
  startDate: string,
): DaySchedule[] {
  if (days.length === 0) {
    return [];
  }

  const normalized: DaySchedule[] = [];
  let cursorDate = normalizeDate(startDate) || normalizeDate(days[0]?.date || "") || CURRENT_DATE;

  for (const day of days) {
    const normalizedDate = normalizeDate(day.date) || "";

    if (normalizedDate.length > 0) {
      cursorDate = normalizedDate;
      normalized.push({
        ...day,
        date: normalizedDate,
      });
      continue;
    }

    const insertedDate = cursorDate;
    cursorDate = addDaysToDate(cursorDate, 1) || cursorDate;
    normalized.push({
      ...day,
      date: insertedDate,
    });
  }

  return normalized;
}

function addDaysToDate(baseDate: string, offset: number): string {
  const normalized = normalizeDate(baseDate);
  if (!normalized) return "";

  const parts = normalized.split("-").map((item) => Number(item));
  if (parts.some((value) => Number.isNaN(value))) return "";

  const [year, month, day] = parts;
  const time = Date.UTC(year, month - 1, day) + offset * 24 * 60 * 60 * 1000;
  const date = new Date(time);

  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function ensureItineraryPeriod(
  period: ItineraryData["overview"]["travelPeriod"],
  days: DaySchedule[],
): ItineraryData["overview"]["travelPeriod"] {
  const normalizedStart = normalizeDate(period.start) || "";
  const normalizedEnd = normalizeDate(period.end) || "";

  if (days.length === 0) {
    return {
      start: normalizedStart || CURRENT_DATE,
      end: normalizedEnd || normalizedStart || CURRENT_DATE,
    };
  }

  const startDay = days[0]?.date || CURRENT_DATE;
  const endDay = days[days.length - 1]?.date || startDay;

  return {
    start: normalizedStart || startDay,
    end: normalizedEnd || endDay,
  };
}

function normalizeFare(raw: unknown): ItineraryData["overview"]["fare"] {
  const fare = isRecord(raw) ? raw : undefined;
  return {
    adultPerPerson: asNumber(fare?.adultPerPerson) ?? 0,
    childPerPerson: asNumber(fare?.childPerPerson) ?? 0,
    infantPerPerson: asNumber(fare?.infantPerPerson) ?? 0,
    total: asNumber(fare?.total) ?? 0,
    totalWithCard: asNumber(fare?.totalWithCard) ?? 0,
  };
}

function formatTimeLabel(value: unknown): string {
  const normalized = normalizeTimeValue(value);
  if (!normalized) return "";
  return normalized.includes(":") ? normalized : `${normalized.slice(0, 2)}:${normalized.slice(2, 4)}`;
}

function formatAirSegment(segment: UnknownRecord, fallbackFlightNo?: string): string {
  const airline = pickFirstString(segment, ["airlNm", "airline"]);
  const flightNo = pickFirstString(segment, ["flgtNm", "flightNo"]) ?? fallbackFlightNo;
  const depApt = pickFirstString(segment, ["depAptNm", "depAptCd"]);
  const arrApt = pickFirstString(segment, ["arrAptNm", "arrAptCd"]);
  const depHm = formatTimeLabel(pickFirstString(segment, ["depHm", "depTime"]));
  const arrHm = formatTimeLabel(pickFirstString(segment, ["arrHm", "arrTime"]));

  return uniqueByText([
    [airline, flightNo].filter((entry): entry is string => Boolean(entry)).join(" "),
    depApt && arrApt ? `${depApt} → ${arrApt}` : undefined,
    depHm && arrHm ? `${depHm} → ${arrHm}` : undefined,
  ]).join(" / ");
}

function isOptionalTourCandidate(value: string): boolean {
  const text = normalizeComparableText(value);
  if (!text) return false;
  if (/(객실1인사용료|1인객실|싱글차지|single)/iu.test(text)) return false;
  return true;
}

function normalizeBasics(raw: unknown): ItineraryData["basics"] {
  const root = isRecord(raw) ? raw : {};
  const base = pickFirstRecord(root, ["baseProductInfo"]) ?? {};
  const itinerary = pickFirstRecord(root, ["itineraryInfo"]) ?? {};
  const touristSpot = pickFirstRecord(root, ["scheduleAndTouristSpotInfo"]) ?? {};

  const includedItems = (pickFirstArray(base, ["trvlExpnInclList"]) ?? []).map((entry) => {
    const row = isRecord(entry) ? entry : {};
    const cat = pickFirstString(row, ["trvlExpnClstNm", "category", "gubun"]);
    const desc = pickFirstString(row, ["trvlExpnDesc", "desc", "description"]);
    return shortText([cat, desc].filter((text): text is string => !!text).join(": "));
  });

  const excludedItems = (pickFirstArray(base, ["trvlExpnNoneInclList", "trvlNoneInclList"]) ?? []).map((entry) => {
    const row = isRecord(entry) ? entry : {};
    const cat = pickFirstString(row, ["trvlExpnClstNm", "category", "gubun"]);
    const desc = pickFirstString(row, ["trvlExpnDesc", "desc", "description"]);
    return shortText([cat, desc].filter((text): text is string => !!text).join(": "));
  });

  const optionalExpenseItems = (pickFirstArray(base, ["trvlChcExpnList"]) ?? []).map((entry) => {
    const row = isRecord(entry) ? entry : {};
    const title = pickFirstString(row, ["corePntTitlNm", "trvlExpnDesc", "desc", "description"]);
    return shortText(title);
  }).filter(isOptionalTourCandidate);
  const optionalTourItems = (pickFirstArray(touristSpot, ["chcInfoList"]) ?? []).map((entry) => {
    const row = isRecord(entry) ? entry : {};
    return shortText(pickFirstString(row, ["chcStsngNm", "name", "title"]));
  });

  const optiontourRemarks = pickFirstRecord(touristSpot, ["optiontourRemarksInfo"]) ??
    pickFirstRecord(root, ["optiontourRemarksInfo"]) ??
    {};
  const noteTrvl = pickFirstRecord(base, ["noteTrvlInfo"])?.noteTrvlRmkCont;
  const noteRes = pickFirstRecord(base, ["noteResInfo"])?.noteResRmkCont;

  const dayRaw = pickFirstArray(itinerary, ["schdInfoList"]) ?? [];
  const hotelNames = dayRaw.flatMap((entry) => {
    const day = isRecord(entry) ? entry : {};
    const hotels = pickFirstArray(day, ["htlInfoList"]) ?? [];
    return hotels
      .map((h) => {
        const row = isRecord(h) ? h : {};
        return pickFirstString(row, ["htlKoNm", "htlEnNm", "name", "hotel"]);
      })
      .filter((item): item is string => typeof item === "string" && item.length > 0);
  });
  const airSegments = pickFirstArray(base, ["pkgAirSeqList"]) ?? pickFirstArray(itinerary, ["pkgAirSeqList"]) ?? [];
  const outboundAir = airSegments.map((entry) => (isRecord(entry) ? entry : {})).find((entry) => asString(entry.segSeq) === "1") ??
    (isRecord(airSegments[0]) ? airSegments[0] : {});
  const inboundAir = airSegments.map((entry) => (isRecord(entry) ? entry : {})).find((entry) => asString(entry.segSeq) === "2") ??
    (isRecord(airSegments[1]) ? airSegments[1] : {});

  return {
    flight: {
      departure: formatAirSegment(outboundAir, pickFirstString(base, ["depFlgtCd"])),
      arrival: formatAirSegment(inboundAir, pickFirstString(base, ["arrFlgtCd"])),
      localVehicle: "",
    },
    accommodation: {
      hotel: uniqueByText(hotelNames).join(", "),
      grade: nonFlagText(pickFirstString(base, ["htlEnn", "grade", "accommodationGrade"])),
      occupancy: nonFlagText(pickFirstString(base, ["occupancy", "roomType", "chdInclRoomYn"])),
    },
    included: uniqueByText(includedItems).join(" / "),
    excluded: uniqueByText(excludedItems).join(" / "),
    optionalTour: uniqueByText([...optionalExpenseItems, ...optionalTourItems]).join(" / "),
    shoppingCenters: Math.max(0, pickFirstNumber(base, ["shpnCntrVistCnt"]) ?? 0),
    notes: uniqueByText([
      asString(noteTrvl),
      asString(noteRes),
      asString(optiontourRemarks.remarkData),
      asString(optiontourRemarks.remarkData2),
    ]).join(" | "),
  };
}

function normalizeItemType(rawType: unknown): ScheduleItemType {
  const normalized = asString(rawType)?.toLowerCase();
  if (!normalized) return "OTHER";
  const contains = (needles: readonly string[]) =>
    needles.some((needle) => normalized.includes(needle));

  if (contains(TYPE_ORDER_HINT.transfer)) return "TRANSFER";
  if (contains(TYPE_ORDER_HINT.sightseeing)) return "SIGHTSEEING";
  if (contains(TYPE_ORDER_HINT.meal)) return "MEAL";
  if (contains(TYPE_ORDER_HINT.accommodation)) return "ACCOMMODATION";
  if (contains(TYPE_ORDER_HINT.other)) return "OTHER";
  return "OTHER";
}

function normalizeItemTypeFromCategory(
  rawType: unknown,
  rawCategoryCode: unknown,
): ScheduleItemType {
  const code = asString(rawCategoryCode);
  if (code === "002") return "TRANSFER";
  if (code === "004") return "MEAL";
  if (code === "001" || code === "005" || code === "007") return "SIGHTSEEING";
  if (code === "099" || code === "102") return "OTHER";

  return normalizeItemType(rawType);
}

function parseMealText(raw: unknown): { breakfast?: string; lunch?: string; dinner?: string } {
  const text = asString(raw);
  if (!text) return {};

  const pattern = /(조식|중식|석식)\s*[:：]?\s*([\s\S]*?)(?=\s*(?:조식|중식|석식)\s*[:：]?|$)/g;
  const values: { breakfast?: string; lunch?: string; dinner?: string } = {};
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text)) !== null) {
    const label = match[1];
    const rawValue = (match[2] ?? "").trim();
    const value = rawValue.replace(/^[\/|·\-\s]+|[\/|·\-\s]+$/g, "").trim();
    if (!value) continue;
    if (label === "조식") values.breakfast = value;
    if (label === "중식") values.lunch = value;
    if (label === "석식") values.dinner = value;
  }

  return values;
}

function normalizeMealSlot(raw: unknown): MealSlot | undefined {
  const normalized = asString(raw)?.toLowerCase();
  if (!normalized) return undefined;
  if (["breakfast", "조식", "아침"].some((v) => normalized.includes(v))) return "breakfast";
  if (["lunch", "중식", "점심"].some((v) => normalized.includes(v))) return "lunch";
  if (["dinner", "석식", "저녁"].some((v) => normalized.includes(v))) return "dinner";
  return undefined;
}

function normalizeMealDetailText(value: string, slot: MealSlot): string {
  const slotLabel = slot === "breakfast" ? "조식" : slot === "lunch" ? "중식" : "석식";
  const text = cleanScheduleContent(value)
    .replace(new RegExp(`^${slotLabel}\\s*[:：]?\\s*`, "u"), "")
    .replace(/^\(?\s*|\s*\)?$/gu, "")
    .trim();
  if (!text || text === "식사" || text === slotLabel) return "";
  return text;
}

function mealValueFromItem(item: UnknownRecord, mealOnly: UnknownRecord, slot: MealSlot): string {
  const direct = asString(mealOnly.value);
  const candidates = [
    direct,
    pickFirstString(item, ["mealCont", "mealDescription", "mealDesc"]),
    pickFirstString(item, ["memoCont", "detailCont", "content", "description"]),
    pickFirstString(item, ["cardNm", "memoTitlNm"]),
    pickFirstString(item, ["mealTypeNm"]),
  ]
    .map((entry) => normalizeMealDetailText(entry ?? "", slot))
    .filter(Boolean);

  return uniqueByText(candidates).join(", ");
}

function normalizeMealItem(item: UnknownRecord): NonNullable<ScheduleItem["meal"]> {
  const meal = pickFirstRecord(item, ["meal", "mealInfo", "meals"]) ?? {};
  const mealFromText = parseMealText(asString(item.content) ?? "");
  const mealOnly = isRecord(meal) ? meal : {};

  const mealSlotText = pickFirstString(item, ["mealType", "mealSlot", "meal_type", "dtlMealDvNm", "mealTypeNm"]);
  const explicitSlot = normalizeMealSlot(mealSlotText);

  const breakfast = asString(mealOnly.breakfast) ?? mealFromText.breakfast;
  const lunch = asString(mealOnly.lunch) ?? mealFromText.lunch;
  const dinner = asString(mealOnly.dinner) ?? mealFromText.dinner;

  const mealMap: { breakfast?: string; lunch?: string; dinner?: string } = {
    ...(breakfast ? { breakfast } : {}),
    ...(lunch ? { lunch } : {}),
    ...(dinner ? { dinner } : {}),
  };

  if (explicitSlot) {
    const value = mealValueFromItem(item, mealOnly, explicitSlot) || "예약";
    if (explicitSlot === "breakfast" && !mealMap.breakfast) mealMap.breakfast = value;
    if (explicitSlot === "lunch" && !mealMap.lunch) mealMap.lunch = value;
    if (explicitSlot === "dinner" && !mealMap.dinner) mealMap.dinner = value;
  }

  return mealMap;
}

function cleanScheduleContent(value: string): string {
  const text = sanitizeText(value)
    .replace(/&amp;/g, "&")
    .replace(/\s*이전다음\s*/gu, " ")
    .replace(/\s*상세보기\s*/gu, " ")
    .replace(/\s+/gu, " ")
    .trim();

  const splitDetailedCard = /^(.+?)\s+-\s+\1\s+(.+)$/u.exec(text);
  if (splitDetailedCard?.[1] && splitDetailedCard[2]) {
    return shortText(`${splitDetailedCard[1]} - ${splitDetailedCard[2]}`);
  }

  return shortText(text);
}

function isPlaceholderScheduleContent(value: string): boolean {
  const normalized = normalizeComparableText(value);
  if (!normalized) return true;
  return [
    "일정",
    "식사",
    "도시간이동",
    "방문지역",
    "인천",
    "도쿄",
  ].includes(normalized);
}

function isNonScheduleNotice(value: string): boolean {
  return /(?:쇼핑안내|현지\s*행사\s*시\s*유의사항|여행일정\s*변경에\s*관한\s*사전\s*동의|카드명은\s*묶음|묶음카드|카드매니저|등록되어\s*있음|테스트|방문지역|국가\s*수정|등록완료)/u.test(
    value,
  );
}

function inferItemTypeFromContent(content: string, fallback: ScheduleItemType): ScheduleItemType {
  if (fallback !== "OTHER") return fallback;
  if (/^(?:조식|중식|석식|식사)\b/u.test(content)) return "MEAL";
  if (/(출발|도착|공항|미팅|이동|버스|차량|탑승|출국|입국)/u.test(content)) return "TRANSFER";
  if (/(숙박|투숙|호텔|체크인|체크아웃)/u.test(content)) return "ACCOMMODATION";
  return fallback;
}

function isGroupCard(item: UnknownRecord): boolean {
  const cardType = asString(item.cmsCardDvCd) ?? asString(item.cardDvCd) ?? asString(item.cardType);
  return cardType?.toUpperCase() === "G";
}

function isSingleCard(item: UnknownRecord): boolean {
  const cardType = asString(item.cmsCardDvCd) ?? asString(item.cardDvCd) ?? asString(item.cardType);
  return cardType?.toUpperCase() === "S";
}

function hasScheduleCardIdentity(item: UnknownRecord): boolean {
  return Boolean(
    pickFirstString(item, ["memoTitlNm", "cardNm", "title", "name", "content", "description"]) ||
      asString(item.cmsCardId),
  );
}

function normalizeExtractedCardTitle(value: string): string {
  const text = cleanScheduleContent(value)
    .replace(/^(?:이전|다음)\s*/u, "")
    .replace(/\s*(?:이전|다음)$/u, "")
    .trim();
  const parts = text.split(/\s+-\s+|[·•|]/u).map((entry) => entry.trim()).filter(Boolean);
  const candidate = parts[parts.length - 1] ?? text;
  return candidate
    .replace(/^(?:묶음카드명|카드명은|방문지역|국가\s*수정|등록완료|실제로는|단일|카드매니저|테스트|tt+t*)\s*/u, "")
    .trim();
}

function isUsableExtractedCardTitle(value: string): boolean {
  const title = value.trim();
  if (title.length < 2 || title.length > 36) return false;
  if (isNonScheduleNotice(title) || isPlaceholderScheduleContent(title)) return false;
  if (/^(?:이전|다음|상세보기|선택관광\s*더보기|펼치기|호텔소개|부대시설|객실시설)$/u.test(title)) return false;
  if (/(?:묶음카드|카드매니저|등록되어\s*있음|테스트|tt+t*)/u.test(title)) return false;
  return /[가-힣A-Za-z]/u.test(title);
}

function extractSingleCardTitlesFromText(value: string): string[] {
  const text = sanitizeText(value)
    .replace(/&amp;/g, "&")
    .replace(/\s+/gu, " ")
    .trim();
  if (!text.includes("상세보기")) return [];

  const titles: string[] = [];
  for (const match of text.matchAll(/(.{2,80}?)\s*상세보기/gu)) {
    const title = normalizeExtractedCardTitle(match[1] ?? "");
    if (isUsableExtractedCardTitle(title)) titles.push(title);
  }

  return uniqueByText(titles);
}

function collectStringSingleCardsFromGroup(item: UnknownRecord): UnknownRecord[] {
  const fields = [
    "memoTitlNm",
    "memoCont",
    "cardNm",
    "cardCntntPc",
    "cardCntntMbl",
    "content",
    "description",
  ];
  return uniqueByText(fields.flatMap((field) => extractSingleCardTitlesFromText(asString(item[field]) ?? "")))
    .map((title, index) => ({
      id: `group-text-card-${index}-${normalizeComparableText(title)}`,
      schdCatgCd: "001",
      schdCatgNm: "관광",
      cmsCardDvCd: "S",
      cardNm: title,
    }));
}

function collectNestedSingleCards(value: unknown, depth = 0): UnknownRecord[] {
  if (depth > 5) return [];
  if (Array.isArray(value)) {
    return value.flatMap((entry) => collectNestedSingleCards(entry, depth + 1));
  }
  if (!isRecord(value)) return [];

  const nested = Object.values(value).flatMap((entry) =>
    Array.isArray(entry) || isRecord(entry) ? collectNestedSingleCards(entry, depth + 1) : []
  );

  if (isSingleCard(value) && hasScheduleCardIdentity(value)) {
    return [value, ...nested];
  }

  return nested;
}

function primaryScheduleKey(item: ScheduleItem): string {
  if (item.type === "MEAL") {
    const slot = item.mealSlot ?? "";
    const mealText = item.mealSlot ? normalizeComparableText(item.meal?.[item.mealSlot] ?? item.content) : normalizeComparableText(item.content);
    return `${item.type}:${slot}:${mealText}`;
  }

  const content = item.content
    .replace(/\s+-\s+.*$/u, "")
    .replace(/\s+\(.+?\)$/u, "")
    .trim();
  const key = normalizeComparableText(content || item.content);
  return `${item.type}:${key}`;
}

function dedupeScheduleItems(items: ScheduleItem[]): ScheduleItem[] {
  const byKey = new Map<string, ScheduleItem>();

  for (const item of items) {
    const key = primaryScheduleKey(item);
    if (!key || key.endsWith(":")) continue;

    const existing = byKey.get(key);
    if (!existing) {
      byKey.set(key, item);
      continue;
    }

    const currentHasMoreFields =
      Number(Boolean(item.region)) + Number(Boolean(item.transport)) + Number(Boolean(item.time));
    const existingHasMoreFields =
      Number(Boolean(existing.region)) + Number(Boolean(existing.transport)) + Number(Boolean(existing.time));
    const shouldReplace =
      currentHasMoreFields > existingHasMoreFields ||
      (currentHasMoreFields === existingHasMoreFields && item.content.length < existing.content.length);

    if (shouldReplace) byKey.set(key, item);
  }

  return Array.from(byKey.values());
}

function normalizeTransferTitleOrMemo(item: UnknownRecord, title: string, memo: string | undefined): string {
  if (title) return title;
  if (memo && memo.length > 0) return memo;
  const depCity = pickFirstString(item, ["depCityNm", "depCity"]);
  const arrCity = pickFirstString(item, ["arriveCityNm", "arrCityNm", "arrCity"]);
  if (depCity || arrCity) return [depCity, arrCity].filter((x) => x).join(" → ");
  return "일정";
}

function normalizeTransport(item: UnknownRecord): string {
  const explicit = pickFirstString(item, [
    "transport",
    "vehicle",
    "route",
    "flightNo",
    "trainNo",
    "airline",
    "depFlgtCd",
    "arrFlgtCd",
  ]);
  if (explicit) return explicit;

  return "";
}

function selectScheduleTitle(
  item: UnknownRecord,
  categoryCode: string | undefined,
  categoryName: string | undefined,
): string {
  const memoTitle = pickFirstString(item, ["memoTitlNm"]);
  const cardName = pickFirstString(item, ["cardNm"]);

  if (categoryCode === "002") {
    return normalizeTransferTitleOrMemo(item, memoTitle ?? "", undefined);
  }

  if (categoryCode === "099" || categoryCode === "102") {
    return memoTitle ?? pickFirstString(item, ["content", "description", "title", "detail", "memo"]) ?? "";
  }

  if (categoryCode === "001" || categoryCode === "005" || categoryCode === "007") {
    const extractedTitle = [
      "memoCont",
      "cardCntntPc",
      "cardCntntMbl",
      "content",
      "description",
    ]
      .flatMap((field) => extractSingleCardTitlesFromText(asString(item[field]) ?? ""))
      .find(Boolean);
    return cardName ??
      pickFirstString(item, [
        "chcStsngNm",
        "sghtNm",
        "spotNm",
        "touristSpotNm",
        "cntntNm",
        "attractionName",
      ]) ??
      extractedTitle ??
      memoTitle ??
      "";
  }

  return memoTitle ??
    cardName ??
    pickFirstString(item, ["content", "description", "title", "detail", "name", "memo"]) ??
    categoryName ??
    "";
}

function normalizeDayItem(
  raw: unknown,
  dayNoFallback: number,
  itemNoFallback: number,
): ScheduleItem | null {
  const item = isRecord(raw) ? raw : {};
  const categoryCode = asString(item.schdCatgCd);
  const categoryName = pickFirstString(item, ["schdCatgNm", "category", "categoryName"]);

  const itemType = normalizeItemTypeFromCategory(
    pickFirstString(item, [
      "type",
      "category",
      "kind",
      "itemType",
      "serviceType",
      "categoryName",
      "schdCatgNm",
    ]),
    categoryCode,
  );

  const mealValues = normalizeMealItem(item);
  const title = selectScheduleTitle(item, categoryCode, categoryName);
  const memoCont = categoryCode === "099" || categoryCode === "102"
    ? pickFirstString(item, ["memoCont", "detailCont", "content"])
    : undefined;
  const content = cleanScheduleContent(
    [title, memoCont]
      .filter((value): value is string => typeof value === "string" && value.length > 0)
      .map((value) => value.trim())
      .join(" - "),
  );

  const hasMeal = Boolean(mealValues.breakfast || mealValues.lunch || mealValues.dinner);

  if (itemType === "MEAL") {
    if (!hasMeal) return null;
  } else if (isPlaceholderScheduleContent(content) || isNonScheduleNotice(content)) {
    return null;
  }

  const region =
    pickFirstString(item, ["region", "area", "location", "city", "place", "spot"]) ??
    pickFirstString(item, ["depCityNm", "arrCityNm", "arriveCityNm"]) ??
    "";

  const transport = normalizeTransport(item);
  const time =
    normalizeTimeValue(
      pickFirstString(item, ["time", "startTime", "startHm", "strtHm", "schdStrtHm", "depTime"]),
      pickFirstString(item, ["endTime", "endHm", "arrTime"]),
    ) ||
    "";

  const mealSlot = normalizeMealSlot(
    pickFirstString(item, ["mealSlot", "mealType", "slot", "meal_category", "dtlMealDvNm", "mealTypeNm"]),
  );

  const explicitId = asString(item.id);
  const safeId = explicitId ?? `item-${dayNoFallback}-${itemNoFallback}`;

  const inferredItemType = inferItemTypeFromContent(content, itemType);
  const normalized: ScheduleItem = {
    id: safeId,
    type: inferredItemType,
    content: "",
    ...(region ? { region } : {}),
    ...(time ? { time } : {}),
    ...(transport ? { transport } : {}),
    ...(asString(item.hotel) ? { hotel: asString(item.hotel) ?? "" } : {}),
    ...(mealSlot ? { mealSlot } : {}),
  };
  const split = splitMcpScheduleContent(content.length > 0 ? content : normalizeTransferTitleOrMemo(item, title, memoCont));
  normalized.content = split.content;
  if (split.detail) normalized.detail = split.detail;
  if (normalized.type === "ACCOMMODATION" && !normalized.hotel) normalized.hotel = normalized.content;

  if (hasMeal) {
    normalized.meal = mealValues;
  }
  return normalized;
}

function normalizeDayItems(
  raw: unknown,
  dayNoFallback: number,
  itemNoFallback: number,
): ScheduleItem[] {
  const item = isRecord(raw) ? raw : {};

  if (isGroupCard(item)) {
    return [...collectNestedSingleCards(item), ...collectStringSingleCardsFromGroup(item)]
      .map((child, childIndex) => {
        const mergedChild: UnknownRecord = {
          ...child,
          schdCatgCd: asString(child.schdCatgCd) ?? asString(item.schdCatgCd) ?? "001",
          schdCatgNm: asString(child.schdCatgNm) ?? asString(item.schdCatgNm) ?? "관광",
          id: asString(child.id) ?? asString(child.cmsCardId) ?? `group-card-${dayNoFallback}-${itemNoFallback}-${childIndex}`,
        };
        return normalizeDayItem(mergedChild, dayNoFallback, itemNoFallback + childIndex);
      })
      .filter((entry): entry is ScheduleItem => entry !== null);
  }

  const normalized = normalizeDayItem(raw, dayNoFallback, itemNoFallback);
  return normalized ? [normalized] : [];
}

function normalizeDay(raw: unknown, index: number): DaySchedule {
  const day = isRecord(raw) ? raw : {};
  const dayNo = asNumber(day.schdSeq) ?? asNumber(day.dayNo) ?? asNumber(day.day) ?? index + 1;
  const dateRaw = pickFirstString(day, ["strtDt", "date", "day", "startDate", "dateAt"]) || "";
  const startDate = asString(day.startDate) ?? "";
  const date = normalizeDate(dateRaw) || normalizeDate(startDate) || "";

  const itemsRaw =
    pickFirstArray(day, ["schdMainInfoList", "items", "schedules", "contents", "services", "activity"]) ?? [];

  const htlInfo = pickFirstArray(day, ["htlInfoList"]) ?? [];
  const hotelItems = htlInfo
    .map((entry, hotelIndex) => {
      if (!isRecord(entry)) return null;
      const hotelNm = pickFirstString(entry, ["htlKoNm", "htlEnNm", "name", "hotel"]);
      if (!hotelNm) return null;
      return {
        id: `hotel-${dayNo}-${hotelIndex}`,
        type: "ACCOMMODATION" as const,
        content: `${hotelNm} 숙박`,
        hotel: hotelNm,
        region: pickFirstString(entry, ["cityNm", "cityCd", "region", "area"]) ?? "",
      } as ScheduleItem;
    })
    .filter((entry): entry is ScheduleItem => entry !== null);

  const mappedItems = itemsRaw
    .flatMap((entry, itemIndex) => normalizeDayItems(entry, Number(dayNo ?? index + 1), itemIndex));
  const items = dedupeScheduleItems([...mappedItems, ...hotelItems]).filter((entry) => entry.id.length > 0);

  return {
    dayNo: dayNo ? dayNo : index + 1,
    date,
    items,
  };
}

function normalizeDays(raw: unknown): DaySchedule[] {
  const root = isRecord(raw) ? raw : {};
  const itinerary = pickFirstRecord(root, ["itineraryInfo"]) ?? root;
  const legacyItinerary = pickFirstRecord(root, ["itinerary"]);

  let days = pickFirstArray(itinerary, [
    "schdInfoList",
    "days",
    "schedule",
    "itinerary",
    "itineraries",
    "daySchedule",
  ]) ??
    pickFirstArray(root, [
      "days",
      "schedule",
      "itinerary",
      "itineraries",
      "daySchedule",
    ]);

  if (!days && legacyItinerary) {
    days = pickFirstArray(legacyItinerary, ["days", "schedules", "items"]);
  }

  if (!days) return [];

  return days
    .map((entry, index) => normalizeDay(entry, index))
    .filter((entry) => entry.dayNo !== 0 && Number.isFinite(entry.dayNo))
    .sort((a, b) => a.dayNo - b.dayNo);
}

function normalizeOverview(raw: unknown): ItineraryData["overview"] {
  const root = isRecord(raw) ? raw : {};
  const base = pickFirstRecord(root, ["baseProductInfo"]) ?? {};
  const overview = pickFirstRecord(root, ["overview", "summary", "overviewInfo"]) ?? {};
  const itinerary = pickFirstRecord(root, ["itineraryInfo"]) ?? {};
  const period = pickFirstRecord(overview, ["travelPeriod", "period", "duration"]) ?? {};
  const fare = pickFirstRecord(overview, ["fare", "price", "pricing"]) ??
    pickFirstRecord(root, ["fare", "price", "pricing"]) ??
    base;

  const baseStart =
    normalizeDate(pickFirstString(base, ["depDay"])) ||
    normalizeDate(pickFirstString(base, ["startDate"])) ||
    "";
  const baseEnd =
    normalizeDate(pickFirstString(base, ["arrDay"])) ||
    normalizeDate(pickFirstString(base, ["endDate"])) ||
    "";

  const periodStart = normalizeDate(pickFirstString(period, ["start", "from", "fromDate"]));
  const periodEnd = normalizeDate(pickFirstString(period, ["end", "to", "toDate"]));
  const start = periodStart || baseStart || baseEnd || CURRENT_DATE;
  const end = periodEnd || baseEnd || start;

  const cityByBase = [pickFirstString(base, ["itnrCntyCds"]), pickFirstString(base, ["vistCity"]), pickFirstString(base, ["prodAreaCd"])];
  const cityByInfo = (pickFirstArray(base, ["cityBasInfoList"]) ?? pickFirstArray(root, ["cityBasInfoList"]) ?? [])
    .map((entry) => {
      const city = isRecord(entry) ? entry : {};
      return pickFirstString(city, ["cityNm", "koCityNm", "cityName"]);
    });
  const cityFromDays = (pickFirstArray(itinerary, ["schdInfoList"]) ?? [])
    .map((entry) => {
      const day = isRecord(entry) ? entry : {};
      return pickFirstString(day, ["vistCity", "arrCityNm", "depCityNm", "arrCityCd", "depCityCd", "vistCity"]);
    });

  const cityList = uniqueByText(cityByInfo).length > 0
    ? uniqueByText(cityByInfo)
    : uniqueByText([
      ...cityByBase,
      ...cityFromDays,
    ]);

  const adultCnt = pickFirstNumber(base, ["adtCnt", "adultCnt", "adult"]) ?? 0;
  const childCnt = pickFirstNumber(base, ["chdCnt", "childCnt", "child"]) ?? 0;
  const infantCnt = pickFirstNumber(base, ["infCnt", "infantCnt", "infant"]) ?? 0;
  const escortCnt = pickFirstNumber(base, ["escortCnt", "escort"]) ?? 0;

  const adultFare = pickFirstNumber(base, ["adtAmt", "adultPerPerson", "adtTaduAmt"]) ?? 0;
  const childFare = pickFirstNumber(base, ["chdAmt", "childPerPerson", "chdTaduAmt"]) ?? 0;
  const infantFare = pickFirstNumber(base, ["infAmt", "infantPerPerson", "infTaduAmt"]) ?? 0;
  const total =
    pickFirstNumber(base, ["adtTotlAmt"]) ??
    pickFirstNumber(base, ["total"]) ??
    normalizeFare(fare).total ??
    0;

  return {
    recipient: pickFirstString(overview, ["recipient", "client", "customer", "customerName"]) ??
      pickFirstString(root, ["recipientName", "고객명"]) ?? "",
    cities: cityList.join(", "),
    travelPeriod: { start, end },
    passengers: {
      adult: adultCnt,
      child: childCnt,
      infant: infantCnt,
      escort: escortCnt,
    },
    fare: {
      adultPerPerson: adultFare,
      childPerPerson: childFare,
      infantPerPerson: infantFare,
      total,
      totalWithCard: pickFirstNumber(base, ["totalWithCard", "totalWithCardAmt"]) ?? total,
    },
    singleCharge: pickFirstNumber(base, ["snglAddAmt", "singleCharge"]) ?? 0,
  };
}

function normalizeHeader(raw: unknown, productCode: string): ItineraryData["header"] {
  const root = isRecord(raw) ? raw : {};
  const base = pickFirstRecord(root, ["baseProductInfo"]) ?? {};
  const header = pickFirstRecord(root, ["header", "metadata", "meta"]) ?? root;

  const title =
    pickFirstString(base, ["saleProdNm", "productName", "상품명", "name"]) ??
    pickFirstString(header, ["groupName", "title", "productName", "name"]) ??
    pickFirstString(root, ["name", "title"]) ??
    productCode;

  return {
    groupName: title,
    writtenAt:
      normalizeDate(pickFirstString(header, ["writtenAt", "작성일", "createdAt", "createdDate"]) ?? CURRENT_DATE) ||
      CURRENT_DATE,
  };
}

export function mapMcpProductToItinerary(
  response: unknown,
  fallbackCode: string,
): ItineraryPayload {
  const root = isRecord(response) ? response : {};
  const payload = pickFirstRecord(root, ["payload", "result", "content"]) ?? root;
  const normalizedRoot =
    pickFirstRecord(payload, ["data"]) ?? pickFirstRecord(root, ["data"]) ?? payload;

  const productCode =
    pickFirstString(root, ["code", "productCode", "saleProdCd", "productCd"]) ??
    pickFirstString(normalizedRoot, ["code", "productCode", "saleProdCd", "productCd"]) ??
    fallbackCode;

  const productName =
    pickFirstString(root, ["name", "title", "productName"]) ??
    pickFirstString(normalizedRoot, ["name", "title", "productName"]) ??
    pickFirstString(normalizedRoot, ["itineraryName", "상품명", "groupName"]) ??
    pickFirstString(pickFirstRecord(normalizedRoot, ["baseProductInfo"]) ?? {}, ["saleProdNm"]) ??
    productCode;

  const normalizedItinerary: ItineraryData = {
    header: normalizeHeader(normalizedRoot, productCode),
    overview: normalizeOverview(normalizedRoot),
    basics: normalizeBasics(normalizedRoot),
    days: [],
  };

  const days = normalizeDays(normalizedRoot);
  if (days.length > 0) {
    normalizedItinerary.days = days;
  } else {
    const schedules = pickFirstArray(normalizedRoot, ["schedules", "items"]);
    if (schedules) normalizedItinerary.days = normalizeDays({ itinerary: schedules });
  }

  const headerGroupName = normalizedItinerary.header.groupName.trim();
  normalizedItinerary.header.groupName = headerGroupName.length > 0 ? headerGroupName : productName;
  normalizedItinerary.header.writtenAt =
    normalizeDate(normalizedItinerary.header.writtenAt) || CURRENT_DATE;

  normalizedItinerary.days = normalizeAndFillDayDates(
    normalizedItinerary.days,
    normalizedItinerary.overview.travelPeriod.start,
  );
  normalizedItinerary.days = enforceAccommodationLast(normalizedItinerary.days);
  normalizedItinerary.overview.travelPeriod = ensureItineraryPeriod(
    normalizedItinerary.overview.travelPeriod,
    normalizedItinerary.days,
  );

  return {
    code: productCode,
    name: productName,
    itinerary: normalizedItinerary,
  };
}
