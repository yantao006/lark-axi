import { describe, expect, it } from "vitest";
import { renderDocument } from "../src/output/render.js";
import { truncateText } from "../src/output/truncate.js";

describe("output rendering", () => {
  it("renders compact rows with explicit fields", () => {
    const output = renderDocument({
      command: "calendar agenda",
      sections: [{ name: "events", rows: [{ title: "Standup", status: "busy", extra: "x" }], fields: ["title", "status"] }]
    }, { format: "compact" });

    expect(output).toContain("status:\n  ok: true\n  command: calendar agenda");
    expect(output).toContain("events[1]{title,status}:");
    expect(output).toContain("Standup,busy");
  });

  it("renders json with the same response envelope", () => {
    const output = renderDocument({
      command: "auth status",
      metadata: { risk: "read" },
      sections: [{ name: "auth", record: { identity: "user" } }],
      nextActions: ["Run `lark-axi calendar agenda`."]
    }, { format: "json" });

    expect(JSON.parse(output)).toMatchObject({
      status: "ok",
      command: "auth status",
      metadata: { risk: "read" },
      sections: [{ name: "auth", record: { identity: "user" } }],
      next_actions: ["Run `lark-axi calendar agenda`."]
    });
    expect(JSON.parse(output).help).toBeUndefined();
  });

  it("renders nested record values as compact JSON", () => {
    const output = renderDocument({
      sections: [{ name: "dry_run", record: { api: [{ method: "POST", url: "/x" }] } }]
    }, { format: "compact" });

    expect(output).toContain('api: [{"method":"POST","url":"/x"}]');
  });

  it("bounds large nested record values in compact output", () => {
    const output = renderDocument({
      sections: [{ name: "raw", record: { payload: { text: "x".repeat(1000) } } }]
    }, { format: "compact" });

    expect(output.length).toBeLessThan(700);
    expect(output).toContain("...");
  });

  it("indents multiline text sections", () => {
    const output = renderDocument({
      sections: [{ name: "examples", text: "lark-axi task list\nlark-axi auth status" }]
    }, { format: "compact" });

    expect(output).toContain("examples:\n  lark-axi task list\n  lark-axi auth status");
  });

  it("truncates long content with total size", () => {
    const result = truncateText("abcdef", false, 3);
    expect(result).toEqual({ text: "abc...", truncated: true, totalChars: 6 });
  });

  it("renders errors with a structured fix action", () => {
    const output = renderDocument({
      command: "im send",
      error: {
        code: "USAGE_ERROR",
        message: "im send requires --chat-id",
        source: "wrapper",
        retryable: false,
        fix: {
          action: "Add the missing chat id.",
          command: "lark-axi im send --chat-id oc_xxx --text hello --dry-run",
          missing: ["chat-id"]
        },
        exitCode: 2
      },
      sections: []
    }, { format: "json" });

    expect(JSON.parse(output)).toMatchObject({
      status: "error",
      command: "im send",
      error: {
        code: "USAGE_ERROR",
        source: "wrapper",
        retryable: false,
        fix: {
          command: "lark-axi im send --chat-id oc_xxx --text hello --dry-run",
          missing: ["chat-id"]
        }
      }
    });
  });
});
