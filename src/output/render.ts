import type { GlobalOptions, RenderDocument } from "../types.js";
import { renderRecord, renderRows } from "./toon.js";

export function renderDocument(document: RenderDocument, options: Pick<GlobalOptions, "format">): string {
  const normalized = normalizeDocument(document);
  if (options.format === "json") {
    return `${JSON.stringify(toWireDocument(normalized), null, 2)}\n`;
  }

  if (normalized.error) {
    const lines = renderRecord("error", {
      status: "error",
      command: normalized.command,
      code: normalized.error.code,
      source: normalized.error.source,
      retryable: normalized.error.retryable,
      message: normalized.error.message,
      fix: normalized.error.fix.command ?? normalized.error.fix.action
    });
    return `${lines.join("\n")}\n`;
  }

  const lines: string[] = [];
  lines.push(...renderRecord("status", {
    ok: true,
    command: normalized.command,
    ...(normalized.metadata ?? {})
  }));
  if (normalized.title) lines.push(`title: ${normalized.title}`);

  for (const section of normalized.sections) {
    if (section.record) {
      lines.push(...renderRecord(section.name, section.record));
    } else if (section.rows) {
      const fields = section.fields ?? inferFields(section.rows);
      lines.push(...renderRows(section.name, section.rows, fields, section.empty ?? "0 results"));
    } else if (section.text) {
      lines.push(...renderText(section.name, section.text));
    }
  }

  if (normalized.nextActions && normalized.nextActions.length > 0) {
    lines.push(`next_actions[${normalized.nextActions.length}]:`);
    for (const item of normalized.nextActions) lines.push(`  ${item}`);
  }

  return `${lines.join("\n")}\n`;
}

function normalizeDocument(document: RenderDocument): RenderDocument {
  return {
    ...document,
    status: document.error ? "error" : "ok",
    command: document.command ?? "unknown",
    nextActions: document.nextActions ?? document.help
  };
}

function toWireDocument(document: RenderDocument): Record<string, unknown> {
  const base: Record<string, unknown> = {
    status: document.status,
    command: document.command
  };
  if (document.title) base.title = document.title;
  if (document.metadata && Object.keys(document.metadata).length > 0) base.metadata = document.metadata;
  if (document.error) {
    base.error = document.error;
    return base;
  }
  base.sections = document.sections;
  if (document.nextActions && document.nextActions.length > 0) base.next_actions = document.nextActions;
  return base;
}

function renderText(name: string, text: string): string[] {
  if (!text.includes("\n")) return [`${name}: ${text}`];
  return [`${name}:`, ...text.split("\n").map((line) => `  ${line}`)];
}

function inferFields(rows: Record<string, unknown>[]): string[] {
  const first = rows[0];
  return first ? Object.keys(first).slice(0, 4) : [];
}
