import type { AxiError, ProcessResult } from "../types.js";

export class UsageError extends Error {
  constructor(
    message: string,
    public readonly help?: string,
    public readonly missing?: string[]
  ) {
    super(message);
  }
}

export function usageError(message: string, help?: string, missing?: string[]): AxiError {
  return {
    code: "USAGE_ERROR",
    message,
    help,
    source: "wrapper",
    retryable: false,
    fix: {
      ...fixFromHelp(help, "Correct the command arguments and retry."),
      ...(missing && missing.length > 0 ? { missing } : {})
    },
    exitCode: 2
  };
}

export function dependencyError(message: string, help?: string): AxiError {
  return {
    code: "LARK_CLI_ERROR",
    message,
    help,
    source: "dependency",
    retryable: false,
    fix: fixFromHelp(help, "Inspect lark-cli availability and retry."),
    exitCode: 1
  };
}

export function missingDependencyError(): AxiError {
  return {
    code: "LARK_CLI_NOT_FOUND",
    message: "lark-cli was not found on PATH",
    help: "Install it first, then run `lark-cli auth login --recommend`.",
    source: "dependency",
    retryable: false,
    fix: {
      action: "Install lark-cli and authenticate before retrying.",
      command: "npx @larksuite/cli@latest install && lark-cli auth login --recommend"
    }
  };
}

export function normalizeProcessError(result: ProcessResult, command: string[]): AxiError {
  if (result.timedOut) {
    return {
      code: "LARK_CLI_TIMEOUT",
      message: `lark-cli timed out while running: ${command.join(" ")}`,
      help: "Retry the command, reduce the request size, or inspect lark-cli directly.",
      source: "timeout",
      retryable: true,
      fix: {
        action: "Retry with a smaller request or inspect the upstream command.",
        command: `lark-cli ${command.join(" ")}`
      },
      exitCode: 1
    };
  }
  const cleanStderr = stripWarnings(result.stderr).trim();
  const upstream = parseUpstreamError(result.stdout) ?? parseUpstreamError(cleanStderr);
  const fallbackHelp = `Run \`lark-axi ${command.join(" ")} --help\` or inspect the upstream command with \`lark-cli ${command.join(" ")} --help\`.`;
  if (upstream) {
    const source = classifyUpstreamSource(upstream.type, upstream.message);
    const help = upstream.hint || fallbackHelp;
    return {
      code: upstream.type || (result.code === 2 ? "LARK_CLI_USAGE_ERROR" : "LARK_CLI_ERROR"),
      message: upstream.message || `lark-cli exited with code ${result.code}`,
      help,
      source,
      retryable: source === "upstream_service",
      fix: fixFromHelp(help, "Follow the upstream remediation and retry."),
      exitCode: result.code === 2 ? 2 : 1
    };
  }
  const text = [result.stdout.trim(), cleanStderr].filter(Boolean).join("\n");
  const source = result.code === 2 ? "upstream_usage" : "upstream_service";
  return {
    code: result.code === 2 ? "LARK_CLI_USAGE_ERROR" : "LARK_CLI_ERROR",
    message: text || `lark-cli exited with code ${result.code}`,
    help: fallbackHelp,
    source,
    retryable: source === "upstream_service",
    fix: fixFromHelp(fallbackHelp, "Inspect command help and retry with corrected arguments."),
    exitCode: result.code === 2 ? 2 : 1
  };
}

function fixFromHelp(help: string | undefined, fallbackAction: string): AxiError["fix"] {
  const command = extractCommand(help);
  return {
    action: help || fallbackAction,
    ...(command ? { command } : {})
  };
}

function extractCommand(text: string | undefined): string | undefined {
  return text?.match(/`([^`]+)`/)?.[1];
}

function classifyUpstreamSource(type: string | undefined, message: string | undefined): AxiError["source"] {
  const text = `${type ?? ""} ${message ?? ""}`.toLowerCase();
  if (text.includes("scope")) return "scope";
  if (text.includes("auth") || text.includes("access_token") || text.includes("login")) return "auth";
  if (text.includes("usage") || text.includes("argument") || text.includes("flag")) return "upstream_usage";
  return "upstream_service";
}

function parseUpstreamError(stdout: string): { type?: string; message?: string; hint?: string } | undefined {
  try {
    const jsonText = extractJsonObject(stdout);
    if (!jsonText) return undefined;
    const parsed = JSON.parse(jsonText) as unknown;
    if (typeof parsed !== "object" || parsed === null) return undefined;
    const error = (parsed as Record<string, unknown>).error;
    if (typeof error !== "object" || error === null) return undefined;
    return error as { type?: string; message?: string; hint?: string };
  } catch {
    return undefined;
  }
}

function extractJsonObject(text: string): string | undefined {
  const start = text.indexOf("{");
  if (start === -1) return undefined;
  for (let i = text.length - 1; i > start; i--) {
    if (text[i] !== "}") continue;
    const candidate = text.slice(start, i + 1);
    try {
      const parsed = JSON.parse(candidate);
      if (typeof parsed === "object" && parsed !== null && "error" in parsed) return candidate;
    } catch { /* try shorter slice */ }
  }
  return undefined;
}

function stripWarnings(stderr: string): string {
  return stderr
    .split("\n")
    .filter((line) => !line.startsWith("[lark-cli] [WARN]"))
    .join("\n");
}
