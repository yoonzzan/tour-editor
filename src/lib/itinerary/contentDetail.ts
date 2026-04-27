export type ContentDetail = {
  content: string;
  detail?: string;
};

function clean(value: string): string {
  return value.replace(/\s+/gu, " ").trim();
}

function splitByDelimiter(value: string, delimiter: RegExp): ContentDetail {
  const normalized = clean(value);
  const match = delimiter.exec(normalized);
  if (!match || match.index <= 0) return { content: normalized };

  const title = clean(normalized.slice(0, match.index));
  const detail = clean(normalized.slice(match.index + match[0].length));

  if (!title || !detail) return { content: normalized };
  if (title.length > 40) return { content: normalized };
  if (/[.。!?！？]$/u.test(title)) return { content: normalized };

  return { content: title, detail };
}

export function splitMcpScheduleContent(value: string): ContentDetail {
  return splitByDelimiter(value, /\s+-\s+/u);
}

export function splitStructuredScheduleContent(value: string): ContentDetail {
  return splitByDelimiter(value, /\s*[:：]\s*/u);
}

export function mergeScheduleContent(content: string, detail?: string): string {
  const title = clean(content);
  const description = clean(detail ?? "");
  if (!title) return description;
  if (!description) return title;
  return `${title} - ${description}`;
}
