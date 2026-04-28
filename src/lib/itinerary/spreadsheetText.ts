function sanitizeText(value: string): string {
  return value.replace(/\s+/gu, " ").trim();
}

function normalizeJsDateString(value: string): string {
  const matched = /^(?:mon|tue|wed|thu|fri|sat|sun)\s+([a-z]{3})\s+(\d{1,2})\s+(\d{4})\b/iu.exec(value.trim());
  if (!matched?.[1] || !matched[2] || !matched[3]) return "";

  const monthMap: Record<string, string> = {
    jan: "01",
    feb: "02",
    mar: "03",
    apr: "04",
    may: "05",
    jun: "06",
    jul: "07",
    aug: "08",
    sep: "09",
    oct: "10",
    nov: "11",
    dec: "12",
  };
  const month = monthMap[matched[1].toLowerCase()];
  if (!month) return "";
  return `${matched[3]}-${month}-${matched[2].padStart(2, "0")}`;
}

function normalizeObjectCell(value: Record<string, unknown>): string {
  const result = value.result;
  if (result !== undefined && result !== null) return normalizeSpreadsheetCell(result);

  const text = value.text;
  if (typeof text === "string") return sanitizeText(text);

  const richText = value.richText;
  if (Array.isArray(richText)) {
    return sanitizeText(
      richText
        .map((part) => {
          if (typeof part !== "object" || part === null) return "";
          const segment = (part as Record<string, unknown>).text;
          return typeof segment === "string" ? segment : "";
        })
        .join("")
    );
  }

  const hyperlink = value.hyperlink;
  if (typeof hyperlink === "string") return sanitizeText(hyperlink);

  return "";
}

export function normalizeSpreadsheetCell(value: unknown): string {
  if (value instanceof Date) {
    const year = value.getFullYear();
    const hh = value.getHours();
    const mm = value.getMinutes();
    if (year <= 1901) {
      if (hh === 0 && mm === 0 && value.getSeconds() === 0 && value.getMilliseconds() === 0) {
        return "";
      }
      return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
    }
    const mmText = String(value.getMonth() + 1).padStart(2, "0");
    const ddText = String(value.getDate()).padStart(2, "0");
    return `${year}-${mmText}-${ddText}`;
  }

  if (typeof value === "object" && value !== null) {
    return normalizeObjectCell(value as Record<string, unknown>);
  }

  const text = sanitizeText(String(value));
  return normalizeJsDateString(text) || text;
}

export function spreadsheetRowsToText(rows: unknown[][]): string {
  const lines: string[] = [];

  for (const row of rows) {
    const values = row.map((cell) => {
      if (cell === null || cell === undefined) return "";
      return normalizeSpreadsheetCell(cell);
    });

    while (values.length > 0 && !values[values.length - 1]) {
      values.pop();
    }

    if (values.some(Boolean)) {
      lines.push(values.join("\t"));
    }
  }

  return lines.join("\n");
}
