import { describe, expect, it } from "vitest";
import { UsageError } from "../src/lark/errors.js";
import { requireMutationApproval } from "../src/safety/policy.js";

describe("mutation safety", () => {
  it("requires dry-run or execute for mutations", () => {
    expect(() => requireMutationApproval({ command: "im send", execute: false, dryRun: false })).toThrow(UsageError);
  });

  it("passes dry-run through to lark-cli", () => {
    expect(requireMutationApproval({ command: "im send", execute: false, dryRun: true })).toEqual(["--dry-run"]);
  });
});
