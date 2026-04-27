const KOREA_TIME_ZONE = "Asia/Seoul";

function getKoreaDateParts(date: Date): { year: string; month: string; day: string } {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: KOREA_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = formatter.formatToParts(date);
  const year = parts.find((part) => part.type === "year")?.value ?? "1970";
  const month = parts.find((part) => part.type === "month")?.value ?? "01";
  const day = parts.find((part) => part.type === "day")?.value ?? "01";
  return { year, month, day };
}

export function todayInKorea(date = new Date()): string {
  const { year, month, day } = getKoreaDateParts(date);
  return `${year}-${month}-${day}`;
}

export function dateStringInKorea(input: Date | string): string {
  const date = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(date.getTime())) return "";
  return todayInKorea(date);
}

export function currentYearInKorea(date = new Date()): number {
  return Number(getKoreaDateParts(date).year);
}

export function formatDateDotInKorea(input: string): string {
  const normalized = /^(\d{4})-(\d{2})-(\d{2})$/u.exec(input);
  if (normalized?.[1] && normalized[2] && normalized[3]) {
    return `${normalized[1]}. ${Number(normalized[2])}. ${Number(normalized[3])}.`;
  }

  const date = new Date(input);
  if (Number.isNaN(date.getTime())) return input;
  const { year, month, day } = getKoreaDateParts(date);
  return `${year}. ${Number(month)}. ${Number(day)}.`;
}

export function formatDateKorInKorea(input: string): string {
  const normalized = /^(\d{4})-(\d{2})-(\d{2})$/u.exec(input);
  if (normalized?.[1] && normalized[2] && normalized[3]) {
    return `${normalized[1]}년 ${Number(normalized[2])}월 ${Number(normalized[3])}일`;
  }

  const date = new Date(input);
  if (Number.isNaN(date.getTime())) return input;
  const { year, month, day } = getKoreaDateParts(date);
  return `${year}년 ${Number(month)}월 ${Number(day)}일`;
}

export { KOREA_TIME_ZONE };
