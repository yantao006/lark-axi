import type { GlobalOptions } from "../types.js";

type FlagValue = string | boolean | string[];

const WRAPPER_FLAGS = new Set(["format", "full", "debug", "profile", "as", "fields", "limit", "help", "execute", "dry-run"]);

export function withForwardedGlobals(args: string[], options: GlobalOptions): string[] {
  const forwarded = [...args];
  if (options.profile) forwarded.push("--profile", options.profile);
  if (options.as && options.as !== "auto") forwarded.push("--as", options.as);
  return forwarded;
}

export function forwardCommandArgs(rest: string[], values: Record<string, FlagValue>, skip: string[] = []): string[] {
  const skipped = new Set([...WRAPPER_FLAGS, ...skip]);
  const forwarded = [...rest];
  for (const [key, value] of Object.entries(values)) {
    if (skipped.has(key)) continue;
    const valueList = Array.isArray(value) ? value : [value];
    for (const item of valueList) {
      forwarded.push(`--${key}`);
      if (typeof item === "string") forwarded.push(item);
    }
  }
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
    if (typeof record.data === "object" && record.data !== null) {
      const data = record.data as Record<string, unknown>;
      for (const key of ["items", "records", "messages", "events", "results"]) {
        if (Array.isArray(data[key])) return (data[key] as unknown[]).map((item) => normalizeRow(item, fallbackKey));
      }
    }
    return [record];
  }
  return [{ [fallbackKey]: value ?? "" }];
}

export function objectAt(value: unknown, path: string[]): Record<string, unknown> | undefined {
  let current = value;
  for (const key of path) {
    if (typeof current !== "object" || current === null) return undefined;
    current = (current as Record<string, unknown>)[key];
  }
  return typeof current === "object" && current !== null && !Array.isArray(current) ? (current as Record<string, unknown>) : undefined;
}

export function countRecord(rows: Record<string, unknown>[], shown: number, limit: number): Record<string, unknown> {
  return {
    shown,
    total_observed: rows.length,
    limit
  };
}

export function truncateRowText(row: Record<string, unknown>, full: boolean, maxChars = 800): Record<string, unknown> {
  const output = { ...row };
  for (const [key, value] of Object.entries(row)) {
    if (typeof value !== "string" || value.length <= maxChars || full) continue;
    output[key] = `${value.slice(0, maxChars)}...`;
    output[`${key}_chars`] = value.length;
  }
  return output;
}

function normalizeRow(value: unknown, fallbackKey: string): Record<string, unknown> {
  return typeof value === "object" && value !== null ? (value as Record<string, unknown>) : { [fallbackKey]: value };
}
