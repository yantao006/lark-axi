import type { LarkCliAdapter } from "./adapter.js";
import { allCommands, type CommandStatus, findCommand } from "../commands/registry.js";

export interface Capability {
  domain: string;
  description: string;
  status: CommandStatus | "partial" | "pass-through";
  command?: string;
}

const PARTIAL_DOMAINS = new Set(allCommands().map((command) => command.key.split(" ")[0]));

export function parseDomains(help: string): Capability[] {
  const capabilities: Capability[] = [];
  const lines = help.split(/\r?\n/);
  let inCommands = false;
  for (const line of lines) {
    if (line.trim() === "Available Commands:") {
      inCommands = true;
      continue;
    }
    if (inCommands && line.trim() === "") break;
    if (!inCommands) continue;
    const match = line.match(/^\s{2}([a-z][\w-]*)\s+(.+)$/);
    if (!match) continue;
    const [, domain, description] = match;
    capabilities.push({
      domain,
      description: description.trim(),
      status: PARTIAL_DOMAINS.has(domain) ? "partial" : "pass-through"
    });
  }
  return capabilities;
}

export function parseDomainCommands(domain: string, help: string): Capability[] {
  const capabilities: Capability[] = [];
  const lines = help.split(/\r?\n/);
  let inCommands = false;
  for (const line of lines) {
    if (line.trim() === "Available Commands:" || line.trim() === "Additional Commands:") {
      inCommands = true;
      continue;
    }
    if (inCommands && line.trim() === "") {
      inCommands = false;
      continue;
    }
    if (!inCommands) continue;
    const match = line.match(/^\s{2}([+\w.-]+)\s+(.+)$/);
    if (!match) continue;
    const [, upstreamCommand, description] = match;
    const isShortcut = upstreamCommand.startsWith("+");
    const command = `${domain} ${normalizeShortcutName(upstreamCommand)}`;
    const definition = isShortcut ? findCommand(command) : undefined;
    capabilities.push({
      domain,
      command: upstreamCommand,
      description: description.trim(),
      status: definition?.status ?? (isShortcut ? "raw-only" : "pass-through")
    });
  }
  return capabilities;
}

export async function discoverCapabilities(adapter: LarkCliAdapter): Promise<Capability[]> {
  const result = await adapter.run(["--help"]);
  return parseDomains(result.stdout);
}

function normalizeShortcutName(name: string): string {
  const shortcut = name.startsWith("+") ? name.slice(1) : name;
  return shortcut
    .replace(/^get-my-tasks$/, "list")
    .replace(/^workbook-info$/, "info")
    .replace(/^search-user$/, "search")
    .replace(/^messages-search$/, "search")
    .replace(/^messages-send$/, "send")
    .replace(/^messages-reply$/, "reply")
    .replace(/^messages-mget$/, "mget")
    .replace(/^chat-list$/, "chats")
    .replace(/^chat-messages-list$/, "messages")
    .replace(/^threads-messages-list$/, "threads")
    .replace(/^messages-resources-download$/, "download-resource")
    .replace(/^room-find$/, "rooms")
    .replace(/^space-list$/, "spaces")
    .replace(/^node-list$/, "nodes")
    .replace(/^node-get$/, "node");
}
