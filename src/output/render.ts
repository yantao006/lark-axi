import type { GlobalOptions, RenderDocument } from "../types.js";
import { renderRecord, renderRows } from "./toon.js";

export function renderDocument(document: RenderDocument, options: Pick<GlobalOptions, "format">): string {
  if (options.format === "json") {
    return `${JSON.stringify(document.error ? { error: document.error } : document, null, 2)}\n`;
  }

  if (document.error) {
    const lines = renderRecord("error", {
      code: document.error.code,
      message: document.error.message,
      help: document.error.help ?? ""
    });
    return `${lines.join("\n")}\n`;
  }

  const lines: string[] = [];
  if (document.title) lines.push(`title: ${document.title}`);

  for (const section of document.sections) {
    if (section.record) {
      lines.push(...renderRecord(section.name, section.record));
    } else if (section.rows) {
      const fields = section.fields ?? inferFields(section.rows);
      lines.push(...renderRows(section.name, section.rows, fields, section.empty ?? "0 results"));
    } else if (section.text) {
      lines.push(...renderText(section.name, section.text));
    }
  }

  if (document.help && document.help.length > 0) {
    lines.push(`help[${document.help.length}]:`);
    for (const item of document.help) lines.push(`  ${item}`);
  }

  return `${lines.join("\n")}\n`;
}

function renderText(name: string, text: string): string[] {
  if (!text.includes("\n")) return [`${name}: ${text}`];
  return [`${name}:`, ...text.split("\n").map((line) => `  ${line}`)];
}

function inferFields(rows: Record<string, unknown>[]): string[] {
  const first = rows[0];
  return first ? Object.keys(first).slice(0, 4) : [];
}
