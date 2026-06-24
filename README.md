# lark-axi

Agent-facing AXI wrapper around the official Lark/Feishu `lark-cli`.

`lark-axi` does not reimplement Feishu OpenAPI. It delegates to `lark-cli` and adds agent-oriented behavior: compact output, structured errors, explicit empty states, truncation hints, safe mutation gates, and raw fallback for uncovered commands.

## Prerequisites

- Node.js 20+
- `lark-cli` installed and available on `PATH`
- Feishu/Lark auth handled by `lark-cli`

Check local state:

```bash
lark-cli auth status
lark-axi
```

If user auth is missing, run:

```bash
lark-cli auth login --recommend
```

## Usage

```bash
lark-axi
lark-axi auth status
lark-axi calendar agenda
lark-axi im search --query "project update"
lark-axi im send --chat-id oc_xxx --text "hello" --dry-run
lark-axi docs fetch --token <doc-token>
lark-axi docs create --title "Weekly" --content "# Progress" --dry-run
lark-axi raw api GET /open-apis/calendar/v4/calendars
```

Global flags:

- `--format json` for full structured output.
- `--full` to disable text truncation.
- `--fields a,b,c` to request specific output fields.
- `--limit N` to cap rows.
- `--profile <name>` to forward a `lark-cli` profile.
- `--as user|bot` to forward identity selection.
- `--debug` to print stack traces to stderr.

## Safety Model

Curated mutation commands require `--dry-run` or `--execute`. Missing arguments fail before `lark-cli` is invoked. The wrapper never runs `lark-cli auth login` automatically.

## Development

```bash
npm install
npm run build
npm test
npm run skill:check
```

Generate the Agent Skill:

```bash
npm run skill:generate
```

## Relationship to lark-cli

`lark-cli` remains the source of truth for auth, scopes, API coverage, pagination, schema introspection, and Feishu platform behavior. `lark-axi` is the agent interface layer on top.
