import type { GlobalOptions } from "../types.js";

export function withForwardedGlobals(args: string[], options: GlobalOptions): string[] {
  const forwarded = [...args];
  if (options.profile) forwarded.push("--profile", options.profile);
  if (options.as && options.as !== "auto") forwarded.push("--as", options.as);
  return forwarded;
}

export function pickFields(rows: Record<string, unknown>[], fields?: string[]): Record<string, unknown>[] {
  if (!fields || fields.length === 0) return rows;
  return rows.map((row) => Object.fromEntries(fields.map((field) => [field, row[field] ?? ""])));
}

export function asRows(value: unknown, fallbackKey = "value"): Record<string, unknown>[] {
  if (Array.isArray(value)) return value.map((item) => normalizeRow(item, fallbackKey));
  if (typeof value === "object" && value !== null) {
    const record = value as Record<string, unknown>;
    for (const key of ["items", "data", "records", "messages", "events"]) {
      if (Array.isArray(record[key])) return (record[key] as unknown[]).map((item) => normalizeRow(item, fallbackKey));
    }
    return [record];
  }
  return [{ [fallbackKey]: value ?? "" }];
}

function normalizeRow(value: unknown, fallbackKey: string): Record<string, unknown> {
  return typeof value === "object" && value !== null ? (value as Record<string, unknown>) : { [fallbackKey]: value };
}
