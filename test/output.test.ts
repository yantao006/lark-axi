import { describe, expect, it } from "vitest";
import { renderDocument } from "../src/output/render.js";
import { truncateText } from "../src/output/truncate.js";

describe("output rendering", () => {
  it("renders compact rows with explicit fields", () => {
    const output = renderDocument({
      sections: [{ name: "events", rows: [{ title: "Standup", status: "busy", extra: "x" }], fields: ["title", "status"] }]
    }, { format: "compact" });

    expect(output).toContain("events[1]{title,status}:");
    expect(output).toContain("Standup,busy");
  });

  it("renders nested record values as compact JSON", () => {
    const output = renderDocument({
      sections: [{ name: "dry_run", record: { api: [{ method: "POST", url: "/x" }] } }]
    }, { format: "compact" });

    expect(output).toContain('api: [{"method":"POST","url":"/x"}]');
  });

  it("truncates long content with total size", () => {
    const result = truncateText("abcdef", false, 3);
    expect(result).toEqual({ text: "abc...", truncated: true, totalChars: 6 });
  });
});
