import type { GlobalOptions, RenderDocument } from "../types.js";
import type { LarkCliAdapter } from "../lark/adapter.js";
import { asRows, pickFields, withForwardedGlobals } from "./common.js";

export async function calendarAgenda(adapter: LarkCliAdapter, options: GlobalOptions): Promise<RenderDocument> {
  const value = await adapter.json(withForwardedGlobals(["calendar", "+agenda", "--format", "json"], options));
  const rows = pickFields(asRows(value), options.fields).slice(0, options.limit ?? 20);
  return {
    sections: [{ name: "events", rows, fields: options.fields ?? ["summary", "start_time", "end_time", "calendar_id"], empty: "0 upcoming calendar events" }],
    help: ["Run `lark-axi raw calendar events instance_view ...` for lower-level event queries."]
  };
}
