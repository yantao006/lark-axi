import type { GlobalOptions, RenderDocument } from "../types.js";
import type { LarkCliAdapter } from "../lark/adapter.js";
import { asRows, countRecord, pickFields, withForwardedGlobals } from "./common.js";

export async function calendarAgenda(adapter: LarkCliAdapter, options: GlobalOptions): Promise<RenderDocument> {
  const value = await adapter.json(withForwardedGlobals(["calendar", "+agenda", "--format", "json"], options));
  const allRows = pickFields(asRows(value), options.fields);
  const limit = options.limit ?? 20;
  const rows = allRows.slice(0, limit);
  return {
    sections: [
      { name: "events_count", record: countRecord(allRows, rows.length, limit) },
      { name: "events", rows, fields: options.fields ?? ["summary", "start_time", "end_time", "calendar_id"], empty: "0 upcoming calendar events" }
    ],
    help:
      allRows.length > rows.length
        ? ["Run `lark-axi calendar agenda --limit <n>` to show more events."]
        : [
            "Run `lark-axi raw calendar events instance_view --calendar-id <calendar_id> --start-time <unix_seconds> --end-time <unix_seconds>` for lower-level event queries."
          ]
  };
}
