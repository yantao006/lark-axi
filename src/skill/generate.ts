import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { displayCommands } from "../commands/registry.js";

const SKILL_PATH = "skills/lark-axi/SKILL.md";

const COMMAND_GUIDANCE = displayCommands()
  .map((command) => `- ${command.description}: \`lark-axi ${command.key}\``)
  .join("\n");

export const SKILL_CONTENT = `---
name: lark-axi
description: Use lark-axi for Lark/Feishu operations from agent shell sessions: calendar, messages, contacts, docs, drive, base, sheets, markdown, tasks, auth status, and raw lark-cli fallback.
---

# Lark AXI

Use \`lark-axi\` when a task needs to inspect or modify Lark/Feishu state through shell execution.

## Command

Run through npx when the package is not installed globally:

\`\`\`bash
npx -y lark-axi
\`\`\`

If installed globally, use:

\`\`\`bash
lark-axi
\`\`\`

## When To Use

${COMMAND_GUIDANCE}

## Rules

- Prefer curated \`lark-axi\` commands before \`raw\`; curated commands return smaller agent-oriented output.
- Use \`lark-axi help <command>\` or \`lark-axi <command> --help\` before using a command whose flags are unclear.
- Treat every response as structured: read \`status\`, \`command\`, metadata, sections, and \`next_actions\`.
- For failures, read \`error.source\`, \`error.retryable\`, and \`error.fix\` before deciding whether to correct arguments, authenticate, request scopes, retry, or inspect upstream help.
- Read the count metadata on list commands: \`shown\`, \`total_observed\`, and \`limit\` tell you whether the compact response was capped.
- Use compact TOON output by default; use \`--format json\` only when exact machine-readable fields are needed.
- Use \`--full\` only after a truncated preview proves the full body is needed.
- For writes, use \`--dry-run\` first unless the user has explicitly authorized the exact action.
- Follow the trial order in \`docs/governance.md\`: offline help/usage checks, read-only live checks, dry-run checks, then explicitly approved \`--execute\` writes against disposable resources.
- After writes, follow the verification hint in \`next_actions\`.
- Do not run \`lark-cli auth login\` automatically; surface the login command and wait for the user.
- Use uncovered lark-cli operations through \`lark-axi raw <lark-cli args...>\`.
`;

export async function generateSkill(check = false): Promise<void> {
  if (check) {
    const current = await readFile(SKILL_PATH, "utf8").catch(() => "");
    if (current !== SKILL_CONTENT) {
      throw new Error(`${SKILL_PATH} is out of date. Run npm run skill:generate.`);
    }
    return;
  }
  await mkdir(dirname(SKILL_PATH), { recursive: true });
  await writeFile(SKILL_PATH, SKILL_CONTENT, "utf8");
}

if (process.argv[1]?.endsWith("generate.ts")) {
  await generateSkill(process.argv.includes("--check"));
}
