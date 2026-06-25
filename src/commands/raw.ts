import type { GlobalOptions, RenderDocument } from "../types.js";
import type { LarkCliAdapter } from "../lark/adapter.js";
import { UsageError } from "../lark/errors.js";
import { asRows, countRecord, pickFields } from "./common.js";
import { allCommands, isMutationRisk, type CommandDefinition } from "./registry.js";

export async function runRaw(adapter: LarkCliAdapter, argv: string[], options: GlobalOptions): Promise<RenderDocument> {
  if (argv.length === 0) {
    throw new UsageError("raw requires lark-cli arguments", "Example: lark-axi raw api GET /open-apis/calendar/v4/calendars");
  }

  const value = await adapter.json(argv);
  const allRows = pickFields(asRows(value), options.fields);
  const limit = options.limit ?? 20;
  const rows = allRows.slice(0, limit);
  return {
    sections: [
      { name: "raw_count", record: countRecord(allRows, rows.length, limit) },
      { name: "raw", rows, fields: options.fields, empty: "0 results from lark-cli raw call" }
    ],
    help: rawHelp(argv, allRows.length > rows.length)
  };
}

function rawHelp(argv: string[], truncated: boolean): string[] {
  const matched = findMatchingDefinition(argv);
  const help: string[] = [];
  if (truncated) help.push("Run `lark-axi --limit <n> raw <lark-cli args...>` to show more rows.");
  if (matched) help.push(`Prefer \`lark-axi ${matched.key}\` for smaller output and stable fields.`);
  if (matched && isMutationRisk(matched.risk)) help.push(`Risk: ${matched.risk}. Curated wrapper requires --dry-run or --execute.`);
  if (help.length === 0) help.push("Prefer curated lark-axi commands when available for smaller output.");
  return help;
}

function findMatchingDefinition(argv: string[]): CommandDefinition | undefined {
  return allCommands().find((command) => {
    const upstream = command.upstream?.args;
    if (!upstream || upstream.length > argv.length) return false;
    return upstream.every((part, index) => argv[index] === part);
  });
}
