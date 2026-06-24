import type { GlobalOptions, RenderDocument } from "../types.js";
import type { LarkCliAdapter } from "../lark/adapter.js";
import { UsageError } from "../lark/errors.js";
import { requireMutationApproval } from "../safety/policy.js";
import { asRows, pickFields, withForwardedGlobals } from "./common.js";

export async function imSearch(adapter: LarkCliAdapter, query: string | undefined, options: GlobalOptions): Promise<RenderDocument> {
  if (!query) throw new UsageError("im search requires --query", "Example: lark-axi im search --query \"project update\"");
  const value = await adapter.json(withForwardedGlobals(["im", "+messages-search", "--query", query, "--format", "json"], options));
  const rows = pickFields(asRows(value), options.fields).slice(0, options.limit ?? 20);
  return {
    sections: [{ name: "messages", rows, fields: options.fields ?? ["message_id", "sender", "text", "create_time"], empty: `0 messages found for ${query}` }]
  };
}

export async function imSend(adapter: LarkCliAdapter, args: { chatId?: string; text?: string; execute: boolean; dryRun: boolean }, options: GlobalOptions): Promise<RenderDocument> {
  if (!args.chatId) throw new UsageError("im send requires --chat-id", "Example: lark-axi im send --chat-id oc_xxx --text \"hello\" --dry-run");
  if (!args.text) throw new UsageError("im send requires --text", "Example: lark-axi im send --chat-id oc_xxx --text \"hello\" --dry-run");
  const safetyArgs = requireMutationApproval({ command: "im send", execute: args.execute, dryRun: args.dryRun });
  const value = await adapter.json(withForwardedGlobals(["im", "+messages-send", "--chat-id", args.chatId, "--text", args.text, ...safetyArgs], options));
  return {
    sections: [{ name: args.dryRun ? "dry_run" : "message", record: asRows(value)[0] ?? { ok: true } }]
  };
}
