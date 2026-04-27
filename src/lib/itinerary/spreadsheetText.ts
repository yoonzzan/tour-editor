function sanitizeText(value: string): string {
  return value.replace(/\s+/gu, " ").trim();
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

  return sanitizeText(String(value));
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
