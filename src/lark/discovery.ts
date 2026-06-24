import type { LarkCliAdapter } from "./adapter.js";

export interface Capability {
  domain: string;
  description: string;
  status: "curated" | "pass-through";
}

const CURATED_DOMAINS = new Set(["auth", "calendar", "im", "docs", "drive", "base", "sheets", "task", "markdown"]);

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
      status: CURATED_DOMAINS.has(domain) ? "curated" : "pass-through"
    });
  }
  return capabilities;
}

export async function discoverCapabilities(adapter: LarkCliAdapter): Promise<Capability[]> {
  const result = await adapter.run(["--help"]);
  return parseDomains(result.stdout);
}
