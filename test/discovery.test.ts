import { describe, expect, it } from "vitest";
import { parseDomainCommands, parseDomains } from "../src/lark/discovery.js";

describe("capability discovery", () => {
  it("parses available commands from lark-cli help", () => {
    const domains = parseDomains(`Available Commands:
  auth        OAuth credentials and authorization management
  calendar    Calendar, event, and attendee management
  wiki        Wiki space and node management

Flags:
`);

    expect(domains).toEqual([
      { domain: "auth", description: "OAuth credentials and authorization management", status: "partial" },
      { domain: "calendar", description: "Calendar, event, and attendee management", status: "partial" },
      { domain: "wiki", description: "Wiki space and node management", status: "pass-through" }
    ]);
  });

  it("classifies domain commands against the lark-axi registry", () => {
    const commands = parseDomainCommands("im", `Available Commands:
  +chat-list        List chats
  +messages-send    Send message
  +unknown-new      New upstream shortcut
  messages          messages operations

Flags:
`);

    expect(commands).toEqual([
      { domain: "im", command: "+chat-list", description: "List chats", status: "generic" },
      { domain: "im", command: "+messages-send", description: "Send message", status: "curated" },
      { domain: "im", command: "+unknown-new", description: "New upstream shortcut", status: "raw-only" },
      { domain: "im", command: "messages", description: "messages operations", status: "pass-through" }
    ]);
  });

  it("classifies contact search-user shortcut as contact search coverage", () => {
    const commands = parseDomainCommands("contact", `Available Commands:
  +search-user      Search users

Flags:
`);

    expect(commands).toEqual([
      { domain: "contact", command: "+search-user", description: "Search users", status: "generic" }
    ]);
  });
});
