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
  const text = [result.stdout.trim(), result.stderr.trim()].filter(Boolean).join("\n");
  return {
    code: result.code === 2 ? "LARK_CLI_USAGE_ERROR" : "LARK_CLI_ERROR",
    message: text || `lark-cli exited with code ${result.code}`,
    help: `Run \`lark-axi ${command.join(" ")} --help\` or inspect the upstream command with \`lark-cli ${command.join(" ")} --help\`.`,
    exitCode: result.code === 2 ? 2 : 1
  };
}
