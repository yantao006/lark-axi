import type { GlobalOptions, RenderDocument } from "../types.js";
import type { LarkCliAdapter } from "../lark/adapter.js";
import { asRows, pickFields } from "./common.js";

export async function runRaw(adapter: LarkCliAdapter, argv: string[], options: GlobalOptions): Promise<RenderDocument> {
  if (argv.length === 0) {
    return {
      error: {
        code: "USAGE_ERROR",
        message: "raw requires lark-cli arguments",
        help: "Example: lark-axi raw api GET /open-apis/calendar/v4/calendars",
        exitCode: 2
      },
      sections: []
    };
  }

  const value = await adapter.json(argv);
  const rows = pickFields(asRows(value), options.fields);
  return {
    sections: [{ name: "raw", rows, fields: options.fields, empty: "0 results from lark-cli raw call" }],
    help: ["Prefer curated lark-axi commands when available for smaller output."]
  };
}
