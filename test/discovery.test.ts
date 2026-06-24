import { describe, expect, it } from "vitest";
import { parseDomains } from "../src/lark/discovery.js";

describe("capability discovery", () => {
  it("parses available commands from lark-cli help", () => {
    const domains = parseDomains(`Available Commands:
  auth        OAuth credentials and authorization management
  calendar    Calendar, event, and attendee management
  wiki        Wiki space and node management

Flags:
`);

    expect(domains).toEqual([
      { domain: "auth", description: "OAuth credentials and authorization management", status: "curated" },
      { domain: "calendar", description: "Calendar, event, and attendee management", status: "curated" },
      { domain: "wiki", description: "Wiki space and node management", status: "pass-through" }
    ]);
  });
});
