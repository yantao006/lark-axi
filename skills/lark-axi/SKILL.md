---
name: lark-axi
description: Use lark-axi for Lark/Feishu operations from agent shell sessions: calendar, messages, docs, drive, base, sheets, markdown, tasks, auth status, and raw lark-cli fallback.
---

# Lark AXI

Use `lark-axi` when a task needs to inspect or modify Lark/Feishu state through shell execution.

## Command

Run through npx when the package is not installed globally:

```bash
npx -y lark-axi
```

If installed globally, use:

```bash
lark-axi
```

## When To Use

- Show lark-cli auth state: `lark-axi auth status`
- List upcoming calendar events: `lark-axi calendar agenda`
- Search messages: `lark-axi im search`
- Preview or send a text, markdown, media, or raw content message: `lark-axi im send`
- Fetch a document preview: `lark-axi docs fetch`
- Preview or create a document: `lark-axi docs create`
- Search Drive files: `lark-axi drive search`
- List Base records: `lark-axi base records`
- Show spreadsheet workbook metadata: `lark-axi sheets info`
- List current user's tasks: `lark-axi task list`
- Fetch a Lark document as Markdown: `lark-axi markdown fetch`
- Pass through to lark-cli for commands not yet wrapped: `lark-axi raw`

## Rules

- Prefer curated `lark-axi` commands before `raw`; curated commands return smaller agent-oriented output.
- Use `lark-axi help <command>` or `lark-axi <command> --help` before using a command whose flags are unclear.
- Treat every response as structured: read `status`, `command`, metadata, sections, and `next_actions`.
- For failures, read `error.source`, `error.retryable`, and `error.fix` before deciding whether to correct arguments, authenticate, request scopes, retry, or inspect upstream help.
- Read the count metadata on list commands: `shown`, `total_observed`, and `limit` tell you whether the compact response was capped.
- Use compact TOON output by default; use `--format json` only when exact machine-readable fields are needed.
- Use `--full` only after a truncated preview proves the full body is needed.
- For writes, use `--dry-run` first unless the user has explicitly authorized the exact action.
- Follow the trial order in `docs/governance.md`: offline help/usage checks, read-only live checks, dry-run checks, then explicitly approved `--execute` writes against disposable resources.
- After writes, follow the verification hint in `next_actions`.
- Do not run `lark-cli auth login` automatically; surface the login command and wait for the user.
- Use uncovered lark-cli operations through `lark-axi raw <lark-cli args...>`.
