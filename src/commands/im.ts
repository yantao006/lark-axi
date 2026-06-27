import type { GlobalOptions, RenderDocument } from "../types.js";
import type { LarkCliAdapter } from "../lark/adapter.js";
import { UsageError } from "../lark/errors.js";
import { requireMutationApproval } from "../safety/policy.js";
import { asRows, countRecord, pickFields, withForwardedGlobals } from "./common.js";

export async function imSearch(adapter: LarkCliAdapter, query: string | undefined, options: GlobalOptions): Promise<RenderDocument> {
  if (!query) throw new UsageError("im search requires --query", "Example: lark-axi im search --query \"project update\"");
  const value = await adapter.json(withForwardedGlobals(["im", "+messages-search", "--query", query, "--format", "json"], options));
  const fields = options.fields ?? ["chat_id", "message_id", "sender", "text", "create_time"];
  const allRows = pickFields(asRows(value).map(normalizeMessageRow), fields);
  const limit = options.limit ?? 20;
  const rows = allRows.slice(0, limit);
  return {
    sections: [
      { name: "messages_count", record: countRecord(allRows, rows.length, limit) },
      { name: "messages", rows, fields, empty: `0 messages found for ${query}` }
    ],
    help: allRows.length > rows.length ? ["Run `lark-axi im search --query \"<text>\" --limit <n>` to show more messages."] : undefined
  };
}

export async function imSend(adapter: LarkCliAdapter, args: { chatId?: string; text?: string; execute: boolean; dryRun: boolean }, options: GlobalOptions): Promise<RenderDocument> {
  if (!args.chatId) throw new UsageError("im send requires --chat-id", "Example: lark-axi im send --chat-id oc_xxx --text \"hello\" --dry-run", ["chat-id"]);
  if (!args.text) throw new UsageError("im send requires --text", "Example: lark-axi im send --chat-id oc_xxx --text \"hello\" --dry-run", ["text"]);
  const safetyArgs = requireMutationApproval({ command: "im send", execute: args.execute, dryRun: args.dryRun, risk: "external-send" });
  const value = await adapter.json(withForwardedGlobals(["im", "+messages-send", "--chat-id", args.chatId, "--text", args.text, ...safetyArgs], options));
  const mode = args.dryRun ? "dry-run" : "execute";
  return {
    metadata: { mode, risk: "external-send" },
    sections: [{
      name: args.dryRun ? "dry_run" : "message",
      record: {
        mode,
        risk: "external-send",
        identity: options.as ?? "auto",
        target: args.chatId,
        intended_effect: args.dryRun ? "preview message send without sending" : "send message to chat",
        ...(asRows(value)[0] ?? { ok: true })
      }
    }],
    nextActions: args.dryRun
      ? ["Re-run with `--execute` only after the exact chat and message are approved."]
      : ["Verify the message in the target chat or fetch it with a read command when available."]
  };
}

function normalizeMessageRow(row: Record<string, unknown>): Record<string, unknown> {
  const { content, ...rest } = row;
  return {
    ...rest,
    text: row.text ?? content ?? ""
  };
}
