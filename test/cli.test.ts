import { describe, expect, it } from "vitest";
import { mkdtempSync, rmSync, symlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { isEntrypoint, runCli } from "../src/cli.js";
import { MockRunner } from "./helpers.js";

describe("lark-axi cli", () => {
  it("renders help without lark-cli", async () => {
    const result = await runCli(["--help"]);
    expect(result.code).toBe(0);
    expect(result.stdout).toContain("lark-axi help");
  });

  it("renders command help without lark-cli", async () => {
    const result = await runCli(["im", "search", "--help"]);
    expect(result.code).toBe(0);
    expect(result.stdout).toContain("lark-axi help im search");
    expect(result.stdout).toContain("im search --query <text>");
  });

  it("explains how to find chat ids in im send help", async () => {
    const result = await runCli(["im", "send", "--help"]);
    expect(result.code).toBe(0);
    expect(result.stdout).toContain("--chat-id <oc_xxx>");
    expect(result.stdout).toContain("lark-axi im search --query \"hello\" --fields chat_id,message_id,text");
    expect(result.stdout).toContain("lark-axi raw im +chat-search --query \"project\"");
  });

  it("detects symlinked npm bin entrypoints", () => {
    const cliPath = fileURLToPath(new URL("../src/cli.ts", import.meta.url));
    const tempDir = mkdtempSync(join(tmpdir(), "lark-axi-"));
    const linkedPath = join(tempDir, "lark-axi");

    try {
      symlinkSync(cliPath, linkedPath);
      expect(isEntrypoint(linkedPath, pathToFileURL(cliPath).href)).toBe(true);
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it("renders home dashboard from lark-cli status", async () => {
    const runner = new MockRunner("/opt/homebrew/bin/lark-cli");
    runner.respond(["--version"], "lark-cli version 1.0.32");
    runner.respond(["auth", "status"], { brand: "feishu", identity: "bot", userName: "Example User", note: "Token missing" });
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

  it("reads auth user details from lark-cli identity summaries", async () => {
    const runner = new MockRunner();
    runner.respond(["auth", "status"], {
      brand: "feishu",
      defaultAs: "auto",
      identity: "user",
      identities: {
        user: {
          status: "ready",
          userName: "Example User",
          tokenStatus: "valid"
        }
      }
    });

    const result = await runCli(["auth", "status"], { runner });
    expect(result.code).toBe(0);
    expect(result.stdout).toContain("identity: user");
    expect(result.stdout).toContain("user: Example User");
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

  it("returns usage exit code when raw has no arguments", async () => {
    const runner = new MockRunner();
    const result = await runCli(["raw"], { runner });
    expect(result.code).toBe(2);
    expect(result.stdout).toContain("raw requires lark-cli arguments");
    expect(runner.calls).toEqual([]);
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

  it("shows required raw calendar instance_view flags in agenda help", async () => {
    const runner = new MockRunner();
    runner.respond(["calendar", "+agenda", "--format", "json"], { items: [] });

    const result = await runCli(["calendar", "agenda"], { runner });

    expect(result.code).toBe(0);
    expect(result.stdout).toContain("calendar events instance_view");
    expect(result.stdout).toContain("--calendar-id <calendar_id>");
    expect(result.stdout).toContain("--start-time <unix_seconds>");
    expect(result.stdout).toContain("--end-time <unix_seconds>");
    expect(result.stdout).not.toContain("instance_view ...");
  });

  it("extracts docs fetch content from the lark-cli v2 document envelope", async () => {
    const runner = new MockRunner();
    runner.respond(["docs", "+fetch", "--api-version", "v2", "--doc", "doc_x", "--format", "json"], {
      ok: true,
      identity: "user",
      data: {
        document: {
          document_id: "doc_x",
          revision_id: 3,
          content: "<title>Smoke</title><p>Hello from doc</p>"
        }
      }
    });

    const result = await runCli(["docs", "fetch", "--token", "doc_x", "--format", "json"], { runner });
    const body = JSON.parse(result.stdout);

    expect(result.code).toBe(0);
    expect(body.sections[0].record.content).toContain("Hello from doc");
    expect(body.sections[0].record.chars).toBe(41);
    expect(runner.calls[0]?.args).toEqual(["docs", "+fetch", "--api-version", "v2", "--doc", "doc_x", "--format", "json"]);
  });

  it("extracts message rows from im search envelopes", async () => {
    const runner = new MockRunner();
    runner.respond(["im", "+messages-search", "--query", "测试", "--format", "json"], {
      ok: true,
      identity: "user",
      data: {
        messages: [
          {
            chat_id: "oc_x",
            message_id: "om_x",
            sender: { sender_type: "app", id: "cli_x" },
            content: "hello message",
            create_time: "2026-06-24 10:33"
          }
        ]
      }
    });

    const result = await runCli(["im", "search", "--query", "测试", "--format", "json"], { runner });
    const body = JSON.parse(result.stdout);

    expect(result.code).toBe(0);
    expect(body.sections[1].rows).toEqual([
      {
        chat_id: "oc_x",
        message_id: "om_x",
        sender: { sender_type: "app", id: "cli_x" },
        text: "hello message",
        create_time: "2026-06-24 10:33"
      }
    ]);
  });

  it("normalizes lark-cli json errors without proxy warnings or update envelopes", async () => {
    const runner = new MockRunner();
    runner.responses.set("drive +search --query x --format json", {
      code: 3,
      stdout: "",
      stderr: `[lark-cli] [WARN] proxy detected: HTTPS_PROXY=http://127.0.0.1:7890\n${JSON.stringify({
        ok: false,
        identity: "user",
        error: {
          type: "missing_scope",
          message: "missing required scope(s): search:docs:read",
          hint: "run auth login"
        },
        _notice: { update: { command: "lark-cli update" } }
      })}`
    });

    const result = await runCli(["drive", "search", "--query", "x", "--format", "json"], { runner });

    expect(result.code).toBe(1);
    expect(result.stdout).toContain('"code": "missing_scope"');
    expect(result.stdout).toContain("missing required scope");
    expect(result.stdout).toContain("run auth login");
    expect(result.stdout).not.toContain("proxy detected");
    expect(result.stdout).not.toContain("_notice");
  });
});
