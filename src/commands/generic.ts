import type { GlobalOptions, RenderDocument } from "../types.js";
import type { LarkCliAdapter } from "../lark/adapter.js";
import { UsageError } from "../lark/errors.js";
import { asRows, pickFields, withForwardedGlobals } from "./common.js";

interface GenericReadCommand {
  args: string[];
  supportsFormat: boolean;
}

const READ_COMMANDS: Record<string, GenericReadCommand> = {
  "drive search": { args: ["drive", "+search"], supportsFormat: true },
  "base records": { args: ["base", "+record-list"], supportsFormat: true },
  "sheets info": { args: ["sheets", "+info"], supportsFormat: false },
  "task list": { args: ["task", "+get-my-tasks"], supportsFormat: true },
  "markdown fetch": { args: ["markdown", "+fetch"], supportsFormat: false }
};

export async function genericRead(adapter: LarkCliAdapter, key: string, extra: string[], options: GlobalOptions): Promise<RenderDocument> {
  const command = READ_COMMANDS[key];
  if (!command) throw new UsageError(`Unsupported command '${key}'`, "Run `lark-axi --help` for supported commands.");
  const formatArgs = command.supportsFormat ? ["--format", "json"] : [];
  const value = await adapter.json(withForwardedGlobals([...command.args, ...extra, ...formatArgs], options));
  const rows = pickFields(asRows(value), options.fields).slice(0, options.limit ?? 20);
  return {
    sections: [{ name: key.replace(" ", "_"), rows, fields: options.fields, empty: `0 results for ${key}` }],
    help: ["Use `lark-axi raw ...` for unsupported lark-cli operations."]
  };
}
