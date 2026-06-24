#!/usr/bin/env node
import { fileURLToPath } from "node:url";
import type { AxiError, CliResult, GlobalOptions, RenderDocument } from "./types.js";
import { renderDocument } from "./output/render.js";
import { LarkCliAdapter, type LarkCliAdapterOptions } from "./lark/adapter.js";
import { UsageError, dependencyError, usageError } from "./lark/errors.js";
import { compareVersions } from "./lark/version.js";
import { discoverCapabilities } from "./lark/discovery.js";
import { authStatus } from "./commands/auth.js";
import { calendarAgenda } from "./commands/calendar.js";
import { docsCreate, docsFetch } from "./commands/docs.js";
import { genericRead } from "./commands/generic.js";
import { imSearch, imSend } from "./commands/im.js";
import { runRaw } from "./commands/raw.js";

const KNOWN_LATEST_LARK_CLI = "1.0.57";

export async function runCli(argv: string[], adapterOptions: LarkCliAdapterOptions = {}): Promise<CliResult> {
  const parsed = parseArgs(argv);
  const adapter = new LarkCliAdapter(adapterOptions);

  try {
    const document = await dispatch(adapter, parsed.positionals, parsed.options, parsed.values);
    return { code: 0, stdout: renderDocument(document, parsed.options) };
  } catch (error) {
    const axiError = toAxiError(error);
    return {
      code: axiError.exitCode ?? 1,
      stdout: renderDocument({ error: axiError, sections: [] }, parsed.options),
      stderr: parsed.options.debug && error instanceof Error ? `${error.stack ?? error.message}\n` : undefined
    };
  }
}

async function dispatch(adapter: LarkCliAdapter, positionals: string[], options: GlobalOptions, values: Record<string, FlagValue>): Promise<RenderDocument> {
  if (values.help || positionals[0] === "help") return helpDocument();
  if (positionals.length === 0) return home(adapter);

  const [domain, subcommand, ...rest] = positionals;
  if (domain === "auth" && (subcommand === "status" || !subcommand)) return authStatus(adapter, options);
  if (domain === "calendar" && subcommand === "agenda") return calendarAgenda(adapter, options);
  if (domain === "im" && subcommand === "search") return imSearch(adapter, stringValue(values.query), options);
  if (domain === "im" && subcommand === "send") {
    return imSend(adapter, {
      chatId: stringValue(values["chat-id"]),
      text: stringValue(values.text),
      execute: values.execute === true,
      dryRun: values["dry-run"] === true
    }, options);
  }
  if (domain === "docs" && subcommand === "fetch") return docsFetch(adapter, stringValue(values.token), options);
  if (domain === "docs" && subcommand === "create") {
    return docsCreate(adapter, {
      title: stringValue(values.title),
      content: stringValue(values.content),
      execute: values.execute === true,
      dryRun: values["dry-run"] === true
    }, options);
  }
  if (domain === "raw") return runRaw(adapter, [subcommand, ...rest].filter(Boolean), options);

  const key = `${domain} ${subcommand ?? ""}`.trim();
  if (["drive search", "base records", "sheets info", "task list", "markdown fetch"].includes(key)) {
    return genericRead(adapter, key, forwardUnknown(rest, values), options);
  }

  throw new UsageError(`Unknown command '${key}'`, "Run `lark-axi --help` for supported commands, or use `lark-axi raw ...`.");
}

async function home(adapter: LarkCliAdapter): Promise<RenderDocument> {
  const version = await adapter.version();
  const auth = await safeAuth(adapter);
  const capabilities = await safeCapabilities(adapter);
  const stale = version.version && compareVersions(version.version, KNOWN_LATEST_LARK_CLI) < 0;

  return {
    title: "lark-axi",
    sections: [
      {
        name: "runtime",
        record: {
          bin: collapseHome(version.executable),
          lark_cli: version.version ?? "unknown",
          latest_seen: KNOWN_LATEST_LARK_CLI,
          update_hint: stale ? "lark-cli update" : ""
        }
      },
      {
        name: "auth",
        record: {
          brand: auth.brand ?? "",
          identity: auth.identity ?? "",
          user: auth.userName ?? "",
          note: auth.note ?? ""
        }
      },
      {
        name: "domains",
        rows: capabilities.slice(0, 12),
        fields: ["domain", "status", "description"],
        empty: "0 lark-cli domains discovered"
      }
    ],
    help: [
      "Run `lark-axi calendar agenda` to inspect upcoming events.",
      "Run `lark-axi auth status` to inspect identity and scopes.",
      "Run `lark-axi raw <lark-cli args...>` for uncovered operations."
    ]
  };
}

function helpDocument(): RenderDocument {
  return {
    title: "lark-axi help",
    sections: [
      {
        name: "commands",
        rows: [
          { command: "auth status", description: "Show lark-cli auth state" },
          { command: "calendar agenda", description: "List upcoming calendar events" },
          { command: "im search --query <text>", description: "Search messages" },
          { command: "im send --chat-id <id> --text <text> --dry-run|--execute", description: "Preview or send a message" },
          { command: "docs fetch --token <token>", description: "Fetch a doc preview" },
          { command: "docs create --title <title> --content <markdown> --dry-run|--execute", description: "Preview or create a doc" },
          { command: "drive search", description: "Search Drive docs and files" },
          { command: "base records", description: "List Base records" },
          { command: "sheets info", description: "Inspect spreadsheet metadata" },
          { command: "task list", description: "List tasks assigned to me" },
          { command: "raw <lark-cli args...>", description: "Delegate uncovered commands" }
        ],
        fields: ["command", "description"]
      }
    ],
    help: ["Global flags: --format json, --full, --debug, --profile <name>, --as user|bot, --fields a,b,c, --limit N"]
  };
}

async function safeAuth(adapter: LarkCliAdapter): Promise<Record<string, unknown>> {
  try {
    return await adapter.authStatus();
  } catch {
    return { note: "auth status unavailable; run lark-cli auth status" };
  }
}

async function safeCapabilities(adapter: LarkCliAdapter): Promise<Record<string, unknown>[]> {
  try {
    return (await discoverCapabilities(adapter)).map((capability) => ({ ...capability }));
  } catch {
    return [];
  }
}

type FlagValue = string | boolean | string[];

function parseArgs(argv: string[]): { positionals: string[]; options: GlobalOptions; values: Record<string, FlagValue> } {
  const positionals: string[] = [];
  const values: Record<string, FlagValue> = {};
  const options: GlobalOptions = { format: "compact", full: false, debug: false };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (!arg.startsWith("--")) {
      positionals.push(arg);
      if (arg === "raw") {
        positionals.push(...argv.slice(i + 1));
        break;
      }
      continue;
    }
    const [key, inlineValue] = arg.slice(2).split("=", 2);
    const next = argv[i + 1];
    const takesValue = inlineValue !== undefined || (next && !next.startsWith("--"));
    const value = inlineValue ?? (takesValue ? next : true);
    addFlag(values, key, value);
    if (inlineValue === undefined && takesValue) i += 1;
  }

  if (lastValue(values.format) === "json") options.format = "json";
  options.full = values.full === true;
  options.debug = values.debug === true;
  options.profile = stringValue(values.profile);
  options.as = asIdentity(values.as);
  options.fields = stringValue(values.fields)?.split(",").map((field) => field.trim()).filter(Boolean);
  const limit = Number(values.limit);
  options.limit = Number.isFinite(limit) && limit > 0 ? limit : undefined;

  return { positionals, options, values };
}

function addFlag(values: Record<string, FlagValue>, key: string, value: string | boolean): void {
  const existing = values[key];
  if (existing === undefined) {
    values[key] = value;
  } else if (Array.isArray(existing)) {
    existing.push(String(value));
  } else {
    values[key] = [String(existing), String(value)];
  }
}

function forwardUnknown(rest: string[], values: Record<string, FlagValue>): string[] {
  const forwarded = [...rest];
  for (const [key, value] of Object.entries(values)) {
    if (["format", "full", "debug", "profile", "as", "fields", "limit", "help"].includes(key)) continue;
    const valueList = Array.isArray(value) ? value : [value];
    for (const item of valueList) {
      forwarded.push(`--${key}`);
      if (typeof item === "string") forwarded.push(item);
    }
  }
  return forwarded;
}

function lastValue(value: FlagValue | undefined): string | boolean | undefined {
  return Array.isArray(value) ? value.at(-1) : value;
}

function stringValue(value: FlagValue | undefined): string | undefined {
  const last = lastValue(value);
  return typeof last === "string" ? last : undefined;
}

function asIdentity(value: FlagValue | undefined): GlobalOptions["as"] {
  const last = lastValue(value);
  return last === "user" || last === "bot" || last === "auto" ? last : undefined;
}

function collapseHome(path: string): string {
  return path.startsWith(process.env.HOME ?? "") ? path.replace(process.env.HOME ?? "", "~") : path;
}

function toAxiError(error: unknown): AxiError {
  if (error instanceof UsageError) return usageError(error.message, error.help);
  if (typeof error === "object" && error !== null && "axiError" in error) return (error as { axiError: AxiError }).axiError;
  if (error instanceof Error) return dependencyError(error.message);
  return dependencyError("Unknown error");
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const result = await runCli(process.argv.slice(2));
  if (result.stderr) process.stderr.write(result.stderr);
  process.stdout.write(result.stdout);
  process.exitCode = result.code;
}
