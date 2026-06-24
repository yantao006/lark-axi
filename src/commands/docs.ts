import type { GlobalOptions, RenderDocument } from "../types.js";
import type { LarkCliAdapter } from "../lark/adapter.js";
import { UsageError } from "../lark/errors.js";
import { requireMutationApproval } from "../safety/policy.js";
import { truncateText } from "../output/truncate.js";
import { asRows, withForwardedGlobals } from "./common.js";

export async function docsFetch(adapter: LarkCliAdapter, token: string | undefined, options: GlobalOptions): Promise<RenderDocument> {
  if (!token) throw new UsageError("docs fetch requires --token", "Example: lark-axi docs fetch --token <doc-token>");
  const value = await adapter.json(withForwardedGlobals(["docs", "+fetch", "--doc", token, "--format", "json"], options));
  const row = asRows(value)[0] ?? {};
  const body = truncateText(row.content ?? row.text ?? row.raw ?? "", options.full);
  return {
    sections: [
      {
        name: "doc",
        record: {
          token,
          title: row.title ?? "",
          chars: body.totalChars,
          content: body.text
        }
      }
    ],
    help: body.truncated ? [`Run \`lark-axi docs fetch --token ${token} --full\` for complete content.`] : undefined
  };
}

export async function docsCreate(adapter: LarkCliAdapter, args: { title?: string; content?: string; execute: boolean; dryRun: boolean }, options: GlobalOptions): Promise<RenderDocument> {
  if (!args.title) throw new UsageError("docs create requires --title", "Example: lark-axi docs create --title \"Weekly\" --content \"...\" --dry-run");
  if (!args.content) throw new UsageError("docs create requires --content", "Example: lark-axi docs create --title \"Weekly\" --content \"...\" --dry-run");
  const safetyArgs = requireMutationApproval({ command: "docs create", execute: args.execute, dryRun: args.dryRun });
  const value = await adapter.json(withForwardedGlobals(["docs", "+create", "--api-version", "v2", "--title", args.title, "--content", args.content, ...safetyArgs], options));
  return {
    sections: [{ name: args.dryRun ? "dry_run" : "doc", record: asRows(value)[0] ?? { ok: true } }]
  };
}
