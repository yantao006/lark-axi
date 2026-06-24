import type { AxiError, ProcessResult } from "../types.js";

export class UsageError extends Error {
  constructor(
    message: string,
    public readonly help?: string
  ) {
    super(message);
  }
}

export function usageError(message: string, help?: string): AxiError {
  return { code: "USAGE_ERROR", message, help, exitCode: 2 };
}

export function dependencyError(message: string, help?: string): AxiError {
  return { code: "LARK_CLI_ERROR", message, help, exitCode: 1 };
}

export function missingDependencyError(): AxiError {
  return {
    code: "LARK_CLI_NOT_FOUND",
    message: "lark-cli was not found on PATH",
    help: "Install it first, then run `lark-cli auth login --recommend`."
  };
}

export function normalizeProcessError(result: ProcessResult, command: string[]): AxiError {
  const cleanStderr = stripWarnings(result.stderr).trim();
  const upstream = parseUpstreamError(result.stdout) ?? parseUpstreamError(cleanStderr);
  if (upstream) {
    return {
      code: upstream.type || (result.code === 2 ? "LARK_CLI_USAGE_ERROR" : "LARK_CLI_ERROR"),
      message: upstream.message || `lark-cli exited with code ${result.code}`,
      help: upstream.hint || `Run \`lark-axi ${command.join(" ")} --help\` or inspect the upstream command with \`lark-cli ${command.join(" ")} --help\`.`,
      exitCode: result.code === 2 ? 2 : 1
    };
  }
  const text = [result.stdout.trim(), cleanStderr].filter(Boolean).join("\n");
  return {
    code: result.code === 2 ? "LARK_CLI_USAGE_ERROR" : "LARK_CLI_ERROR",
    message: text || `lark-cli exited with code ${result.code}`,
    help: `Run \`lark-axi ${command.join(" ")} --help\` or inspect the upstream command with \`lark-cli ${command.join(" ")} --help\`.`,
    exitCode: result.code === 2 ? 2 : 1
  };
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
