import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

const SKILL_PATH = "skills/lark-axi/SKILL.md";

export const SKILL_CONTENT = `---
name: lark-axi
description: Use lark-axi for Lark/Feishu operations from agent shell sessions: calendar, messages, docs, drive, base, sheets, tasks, auth status, and raw lark-cli fallback.
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

- Check auth and identity: \`lark-axi auth status\`
- Inspect calendar context: \`lark-axi calendar agenda\`
- Search messages: \`lark-axi im search --query "<text>"\`
- Preview sending a message: \`lark-axi im send --chat-id <oc_xxx> --text "<text>" --dry-run\`
- Fetch document preview: \`lark-axi docs fetch --token <token>\`
- Preview document creation: \`lark-axi docs create --title "<title>" --content "<markdown>" --dry-run\`
- Use uncovered lark-cli operations: \`lark-axi raw <lark-cli args...>\`
- Inspect command syntax: \`lark-axi help <command>\` or \`lark-axi <command> --help\`

## Rules

- Prefer curated \`lark-axi\` commands before \`raw\`; curated commands return smaller agent-oriented output.
- Read the count metadata on list commands: \`shown\`, \`total_observed\`, and \`limit\` tell you whether the compact response was capped.
- Use \`--format json\` only when exact machine-readable fields are needed.
- Use \`--full\` only after a truncated preview proves the full body is needed.
- For writes, use \`--dry-run\` first unless the user has explicitly authorized the exact action.
- Do not run \`lark-cli auth login\` automatically; surface the login command and wait for the user.
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
