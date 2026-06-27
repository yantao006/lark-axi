import { UsageError } from "../lark/errors.js";

export interface MutationPolicy {
  command: string;
  execute: boolean;
  dryRun: boolean;
  risk?: string;
}

export function requireMutationApproval(policy: MutationPolicy): string[] {
  if (policy.dryRun && policy.execute) {
    throw new UsageError(
      `Mutation '${policy.command}' received both --dry-run and --execute.`,
      "Choose exactly one execution mode.",
      ["dry-run", "execute"]
    );
  }
  if (policy.dryRun) return ["--dry-run"];
  if (!policy.execute) {
    throw new UsageError(
      `Mutation '${policy.command}' needs explicit execution.`,
      `Risk: ${policy.risk ?? "write"}. Re-run with --execute to perform it, or --dry-run to preview it.`,
      ["dry-run", "execute"]
    );
  }
  return [];
}
