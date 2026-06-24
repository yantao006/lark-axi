import { UsageError } from "../lark/errors.js";

export interface MutationPolicy {
  command: string;
  execute: boolean;
  dryRun: boolean;
}

export function requireMutationApproval(policy: MutationPolicy): string[] {
  if (policy.dryRun) return ["--dry-run"];
  if (!policy.execute) {
    throw new UsageError(
      `Mutation '${policy.command}' needs explicit execution.`,
      `Re-run with --execute to perform it, or --dry-run to preview it.`
    );
  }
  return [];
}
