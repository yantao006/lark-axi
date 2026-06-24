function needsQuotes(value: string): boolean {
  return value === "" || /[\n,:{}\[\]"#]|^\s|\s$/.test(value);
}

function scalar(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "object") return JSON.stringify(value);
  const text = String(value);
  return needsQuotes(text) ? JSON.stringify(text) : text;
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
