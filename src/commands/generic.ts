import type { GlobalOptions, RenderDocument } from "../types.js";
import type { LarkCliAdapter } from "../lark/adapter.js";
import { UsageError } from "../lark/errors.js";
import { requireMutationApproval } from "../safety/policy.js";
import type { CommandDefinition } from "./registry.js";
import { isMutationRisk } from "./registry.js";
import { asRows, countRecord, pickFields, truncateRowText, withForwardedGlobals } from "./common.js";

export async function genericRead(adapter: LarkCliAdapter, definition: CommandDefinition, extra: string[], options: GlobalOptions): Promise<RenderDocument> {
  const upstream = definition.upstream;
  const key = definition.key;
  if (!upstream) throw new UsageError(`Unsupported command '${key}'`, "Run `lark-axi --help` for supported commands.");
  const formatArgs = upstream.supportsFormat ? ["--format", "json"] : [];
  const value = await adapter.json(withForwardedGlobals([...upstream.args, ...extra, ...formatArgs], options));
  const fields = options.fields ?? definition?.defaultFields;
  const allRows = pickFields(asRows(value).map((row) => truncateRowText(row, options.full)), fields);
  const limit = options.limit ?? 20;
  const rows = allRows.slice(0, limit);
  const name = key.replace(" ", "_");
  return {
    sections: [
      { name: `${name}_count`, record: countRecord(allRows, rows.length, limit) },
      { name, rows, fields, empty: definition?.empty ?? `0 results for ${key}` }
    ],
    help:
      allRows.length > rows.length
        ? [`Run \`lark-axi ${key} --limit <n>\` to show more results.`]
        : ["Use `lark-axi raw ...` for unsupported lark-cli operations."]
  };
}

export async function genericMutation(
  adapter: LarkCliAdapter,
  definition: CommandDefinition,
  extra: string[],
  args: { execute: boolean; dryRun: boolean },
  options: GlobalOptions
): Promise<RenderDocument> {
  if (!definition.upstream) throw new UsageError(`Unsupported command '${definition.key}'`, "Run `lark-axi --help` for supported commands.");
  if (!isMutationRisk(definition.risk)) {
    throw new UsageError(`Command '${definition.key}' is not a mutation`, "Use the read form or raw fallback.");
  }
  const safetyArgs = requireMutationApproval({ command: definition.key, execute: args.execute, dryRun: args.dryRun, risk: definition.risk });
  const formatArgs = definition.upstream.supportsFormat ? ["--format", "json"] : [];
  const value = await adapter.json(withForwardedGlobals([...definition.upstream.args, ...extra, ...safetyArgs, ...formatArgs], options));
  const rows = asRows(value);
  return {
    sections: [
      {
        name: args.dryRun ? "dry_run" : "result",
        record: {
          risk: definition.risk,
          ...(rows[0] ?? { ok: true })
        }
      }
    ]
  };
}
