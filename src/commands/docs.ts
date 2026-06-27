import type { GlobalOptions, RenderDocument } from "../types.js";
import type { LarkCliAdapter } from "../lark/adapter.js";
import { UsageError } from "../lark/errors.js";
import { requireMutationApproval } from "../safety/policy.js";
import { truncateText } from "../output/truncate.js";
import { asRows, objectAt, withForwardedGlobals } from "./common.js";

export async function docsFetch(adapter: LarkCliAdapter, token: string | undefined, options: GlobalOptions): Promise<RenderDocument> {
  if (!token) throw new UsageError("docs fetch requires --token", "Example: lark-axi docs fetch --token <doc-token>");
  const value = await adapter.json(withForwardedGlobals(["docs", "+fetch", "--api-version", "v2", "--doc", token, "--format", "json"], options));
  const document = objectAt(value, ["data", "document"]) ?? asRows(value)[0] ?? {};
  const content = stringValue(document.content ?? document.text ?? document.raw);
  const body = truncateText(content, options.full);
  return {
    sections: [
      {
        name: "doc",
        record: {
          token,
          title: stringValue(document.title) || titleFromXml(content),
          chars: body.totalChars,
          content: body.text
        }
      }
    ],
    help: body.truncated ? [`Run \`lark-axi docs fetch --token ${token} --full\` for complete content.`] : undefined
  };
}

export async function docsCreate(adapter: LarkCliAdapter, args: { title?: string; content?: string; execute: boolean; dryRun: boolean }, options: GlobalOptions): Promise<RenderDocument> {
  if (!args.title) throw new UsageError("docs create requires --title", "Example: lark-axi docs create --title \"Weekly\" --content \"...\" --dry-run", ["title"]);
  if (!args.content) throw new UsageError("docs create requires --content", "Example: lark-axi docs create --title \"Weekly\" --content \"...\" --dry-run", ["content"]);
  const safetyArgs = requireMutationApproval({ command: "docs create", execute: args.execute, dryRun: args.dryRun });
  const value = await adapter.json(withForwardedGlobals(["docs", "+create", "--api-version", "v2", "--title", args.title, "--content", args.content, ...safetyArgs], options));
  const mode = args.dryRun ? "dry-run" : "execute";
  return {
    metadata: { mode, risk: "write" },
    sections: [{
      name: args.dryRun ? "dry_run" : "doc",
      record: {
        mode,
        risk: "write",
        identity: options.as ?? "auto",
        target: args.title,
        intended_effect: args.dryRun ? "preview document creation without creating" : "create document",
        ...(asRows(value)[0] ?? { ok: true })
      }
    }],
    nextActions: args.dryRun
      ? ["Re-run with `--execute` only after the title and content are approved."]
      : ["Fetch the returned document token or URL to verify the created document."]
  };
}

function stringValue(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function titleFromXml(content: string): string {
  return content.match(/<title[^>]*>(.*?)<\/title>/s)?.[1] ?? "";
}
