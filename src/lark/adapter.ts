import { spawn } from "node:child_process";
import { access } from "node:fs/promises";
import { delimiter, join } from "node:path";
import type { CommandRunner, ProcessResult } from "../types.js";
import { missingDependencyError, normalizeProcessError } from "./errors.js";
import { parseLarkCliVersion } from "./version.js";

const DEFAULT_TIMEOUT_MS = 30_000;

export class NodeCommandRunner implements CommandRunner {
  async which(command: string): Promise<string | undefined> {
    if (process.env.LARK_CLI_PATH) {
      try {
        await access(process.env.LARK_CLI_PATH);
        return process.env.LARK_CLI_PATH;
      } catch {
        return undefined;
      }
    }

    const paths = (process.env.PATH ?? "").split(delimiter);
    for (const path of paths) {
      const candidate = join(path, command);
      try {
        await access(candidate);
        return candidate;
      } catch {
        // Continue looking through PATH.
      }
    }
    return undefined;
  }

  async run(command: string, args: string[], options: { timeoutMs?: number } = {}): Promise<ProcessResult> {
    return new Promise((resolve) => {
      const child = spawn(command, args, {
        stdio: ["ignore", "pipe", "pipe"],
        env: process.env
      });
      let stdout = "";
      let stderr = "";
      let timedOut = false;
      const timer = setTimeout(() => {
        timedOut = true;
        child.kill("SIGTERM");
      }, options.timeoutMs ?? DEFAULT_TIMEOUT_MS);

      child.stdout.setEncoding("utf8");
      child.stderr.setEncoding("utf8");
      child.stdout.on("data", (chunk) => {
        stdout += chunk;
      });
      child.stderr.on("data", (chunk) => {
        stderr += chunk;
      });
      child.on("error", (error) => {
        clearTimeout(timer);
        resolve({ code: 1, stdout: "", stderr: error.message });
      });
      child.on("close", (code) => {
        clearTimeout(timer);
        resolve({ code: code ?? 1, stdout, stderr, timedOut });
      });
    });
  }
}

export interface LarkCliAdapterOptions {
  runner?: CommandRunner;
  executable?: string;
}

export class LarkCliAdapter {
  private readonly runner: CommandRunner;
  private executable?: string;

  constructor(options: LarkCliAdapterOptions = {}) {
    this.runner = options.runner ?? new NodeCommandRunner();
    this.executable = options.executable;
  }

  async resolveExecutable(): Promise<string> {
    if (this.executable) return this.executable;
    const found = this.runner.which ? await this.runner.which("lark-cli") : "lark-cli";
    if (!found) throw Object.assign(new Error("lark-cli missing"), { axiError: missingDependencyError() });
    this.executable = found;
    return found;
  }

  async run(args: string[]): Promise<ProcessResult> {
    const executable = await this.resolveExecutable();
    return this.runner.run(executable, args, { timeoutMs: DEFAULT_TIMEOUT_MS });
  }

  async json(args: string[]): Promise<unknown> {
    const result = await this.run(args);
    if (result.code !== 0) throw Object.assign(new Error("lark-cli failed"), { axiError: normalizeProcessError(result, args) });
    try {
      return JSON.parse(result.stdout);
    } catch {
      return { raw: result.stdout.trim() };
    }
  }

  async version(): Promise<{ executable: string; version?: string }> {
    const executable = await this.resolveExecutable();
    const result = await this.runner.run(executable, ["--version"]);
    return { executable, version: parseLarkCliVersion(result.stdout || result.stderr) };
  }

  async authStatus(): Promise<Record<string, unknown>> {
    const value = await this.json(["auth", "status"]);
    return typeof value === "object" && value !== null ? (value as Record<string, unknown>) : { raw: value };
  }
}
