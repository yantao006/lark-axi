import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const governance = readFileSync("docs/governance.md", "utf8");
const liveCases = readFileSync("docs/testing/lark-axi-live-test-cases.md", "utf8");
const agents = readFileSync("AGENTS.md", "utf8");

describe("governance documentation", () => {
  it("records the selected continuation baseline and stale branch warning", () => {
    expect(governance).toContain("origin/feat/lark-axi-wrapper@4484fd9e6a7a419244c87033fc0217ff6a3b60c5");
    expect(governance).toContain("feat/agent-ergonomic-contracts@53a5f2d");
    expect(agents).toContain("origin/feat/lark-axi-wrapper@4484fd9e6a7a419244c87033fc0217ff6a3b60c5");
  });

  it("keeps trial phases separated by side-effect risk", () => {
    for (const phase of ["Offline help and usage", "Read-only live", "Dry-run live", "Execute/write"]) {
      expect(governance).toContain(phase);
    }

    expect(governance).toContain("Never run `--execute`");
    expect(liveCases).toContain("offline help/usage checks, read-only live checks, dry-run checks");
  });

  it("keeps the command coverage evidence checklist explicit", () => {
    for (const requirement of [
      "Registry entry",
      "Realistic fixture",
      "Routing and normalization tests",
      "Safety tests",
      "Help examples",
      "Documentation sync",
      "Skill sync"
    ]) {
      expect(governance).toContain(requirement);
    }
  });
});
