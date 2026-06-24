import type { CommandRunner, ProcessResult } from "../src/types.js";

export class MockRunner implements CommandRunner {
  calls: Array<{ command: string; args: string[] }> = [];
  responses = new Map<string, ProcessResult>();

  constructor(private readonly executable = "/usr/local/bin/lark-cli") {}

  async which(_command: string): Promise<string | undefined> {
    return this.executable;
  }

  async run(command: string, args: string[]): Promise<ProcessResult> {
    this.calls.push({ command, args });
    const key = args.join(" ");
    return this.responses.get(key) ?? { code: 0, stdout: "{}", stderr: "" };
  }

  respond(args: string[], stdout: unknown, code = 0): void {
    this.responses.set(args.join(" "), {
      code,
      stdout: typeof stdout === "string" ? stdout : JSON.stringify(stdout),
      stderr: ""
    });
  }
}
