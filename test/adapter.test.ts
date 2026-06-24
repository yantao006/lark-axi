import { describe, expect, it } from "vitest";
import { LarkCliAdapter } from "../src/lark/adapter.js";
import { parseLarkCliVersion } from "../src/lark/version.js";
import { MockRunner } from "./helpers.js";

describe("LarkCliAdapter", () => {
  it("parses lark-cli version output", () => {
    expect(parseLarkCliVersion("lark-cli version 1.0.32")).toBe("1.0.32");
  });

  it("resolves executable and auth status through injected runner", async () => {
    const runner = new MockRunner("/opt/homebrew/bin/lark-cli");
    runner.respond(["--version"], "lark-cli version 1.0.32");
    runner.respond(["auth", "status"], { brand: "feishu", identity: "bot" });

    const adapter = new LarkCliAdapter({ runner });
    await expect(adapter.version()).resolves.toEqual({ executable: "/opt/homebrew/bin/lark-cli", version: "1.0.32" });
    await expect(adapter.authStatus()).resolves.toMatchObject({ brand: "feishu", identity: "bot" });
  });
});
