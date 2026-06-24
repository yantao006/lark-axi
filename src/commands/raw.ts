import type { GlobalOptions, RenderDocument } from "../types.js";
import type { LarkCliAdapter } from "../lark/adapter.js";
import { UsageError } from "../lark/errors.js";
import { asRows, countRecord, pickFields } from "./common.js";

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
    help:
      allRows.length > rows.length
        ? ["Run `lark-axi raw <lark-cli args...> --limit <n>` to show more rows."]
        : ["Prefer curated lark-axi commands when available for smaller output."]
  };
}
