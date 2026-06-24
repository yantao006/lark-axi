import { describe, expect, it } from "vitest";
import { runCli } from "../src/cli.js";
import { MockRunner } from "./helpers.js";

describe("lark-axi cli", () => {
  it("renders help without lark-cli", async () => {
    const result = await runCli(["--help"]);
    expect(result.code).toBe(0);
    expect(result.stdout).toContain("lark-axi help");
  });

  it("renders home dashboard from lark-cli status", async () => {
    const runner = new MockRunner("/opt/homebrew/bin/lark-cli");
    runner.respond(["--version"], "lark-cli version 1.0.32");
    runner.respond(["auth", "status"], { brand: "feishu", identity: "bot", userName: "Yan", note: "Token missing" });
    runner.respond(["--help"], `Available Commands:
  auth        OAuth credentials and authorization management
  calendar    Calendar, event, and attendee management

Flags:
`);

    const result = await runCli([], { runner });
    expect(result.code).toBe(0);
    expect(result.stdout).toContain("lark_cli: 1.0.32");
    expect(result.stdout).toContain("Token missing");
    expect(result.stdout).toContain("domains[2]{domain,status,description}:");
  });

  it("does not invoke lark-cli when mutation lacks approval", async () => {
    const runner = new MockRunner();
    const result = await runCli(["im", "send", "--chat-id", "oc_x", "--text", "hello"], { runner });
    expect(result.code).toBe(2);
    expect(result.stdout).toContain("USAGE_ERROR");
    expect(runner.calls).toEqual([]);
  });

  it("forwards raw flags to lark-cli", async () => {
    const runner = new MockRunner();
    runner.respond(["api", "GET", "/open-apis/calendar/v4/calendars", "--params", "{}"], { items: [{ id: "primary" }] });

    const result = await runCli(["raw", "api", "GET", "/open-apis/calendar/v4/calendars", "--params", "{}"], { runner });
    expect(result.code).toBe(0);
    expect(runner.calls[0]?.args).toEqual(["api", "GET", "/open-apis/calendar/v4/calendars", "--params", "{}"]);
  });

  it("does not consume raw command flags as wrapper flags", async () => {
    const runner = new MockRunner();
    runner.respond(["base", "+record-list", "--field-id", "Name", "--field-id", "Status", "--format", "json"], { items: [] });

    const result = await runCli(["raw", "base", "+record-list", "--field-id", "Name", "--field-id", "Status", "--format", "json"], { runner });
    expect(result.code).toBe(0);
    expect(runner.calls[0]?.args).toEqual(["base", "+record-list", "--field-id", "Name", "--field-id", "Status", "--format", "json"]);
  });

  it("maps generic curated reads to real lark-cli shortcuts", async () => {
    const runner = new MockRunner();
    runner.respond(["task", "+get-my-tasks", "--format", "json"], { items: [] });
    runner.respond(["sheets", "+info"], { spreadsheet_token: "sht_x" });

    await expect(runCli(["task", "list"], { runner })).resolves.toMatchObject({ code: 0 });
    await expect(runCli(["sheets", "info"], { runner })).resolves.toMatchObject({ code: 0 });
    expect(runner.calls.map((call) => call.args)).toEqual([
      ["task", "+get-my-tasks", "--format", "json"],
      ["sheets", "+info"]
    ]);
  });
});
