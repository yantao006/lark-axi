function needsQuotes(value: string): boolean {
  return value === "" || /[\n,:{}\[\]"#]|^\s|\s$/.test(value);
}

const DEFAULT_NESTED_VALUE_MAX_CHARS = 400;

function scalar(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "object") return compactJson(value);
  const text = String(value);
  return needsQuotes(text) ? JSON.stringify(text) : text;
}

function compactJson(value: unknown): string {
  const text = JSON.stringify(value);
  if (text.length <= DEFAULT_NESTED_VALUE_MAX_CHARS) return text;
  return JSON.stringify({ _truncated: true, preview: text.slice(0, DEFAULT_NESTED_VALUE_MAX_CHARS) });
}

export function renderRecord(name: string, record: Record<string, unknown>): string[] {
  const lines = [`${name}:`];
  for (const [key, value] of Object.entries(record)) {
    lines.push(`  ${key}: ${scalar(value)}`);
  }
  return lines;
}

export function renderRows(name: string, rows: Record<string, unknown>[], fields: string[], empty: string): string[] {
  if (rows.length === 0) return [`${name}: ${empty}`];
  const lines = [`${name}[${rows.length}]{${fields.join(",")}}:`];
  for (const row of rows) {
    lines.push(`  ${fields.map((field) => scalar(row[field])).join(",")}`);
  }
  return lines;
}
