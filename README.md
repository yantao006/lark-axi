# lark-axi

[中文版](README.zh.md)

Agent-facing AXI wrapper around the official Lark/Feishu [`lark-cli`](https://github.com/larksuite/cli).

`lark-axi` does not reimplement the Lark/Feishu Open Platform APIs. It delegates to `lark-cli` and adds an agent-oriented interface: compact output, structured errors, explicit empty states, truncation hints, safe mutation gates, and raw fallback for uncovered operations.

[Install](#installation--quick-start) · [Agent Quick Start](#agent-quick-start) · [Commands](#commands) · [Output](#output-model) · [Safety](#safety-model) · [Development](#development)

## Why lark-axi?

- **Built on the official CLI**: authentication, scopes, app configuration, schema coverage, pagination, and platform behavior remain owned by `lark-cli`.
- **Agent-oriented defaults**: command output is compact and stable enough for shell-based agents to inspect without pulling large JSON payloads by default.
- **Safer mutations**: curated write commands require either `--dry-run` or `--execute`, and required arguments are validated before calling `lark-cli`.
- **Progressive coverage**: high-value workflows get curated wrappers first; everything else remains available through `raw`.
- **Structured failure modes**: dependency, usage, and upstream errors render as predictable records instead of unbounded stderr.

## Relationship to lark-cli

The official `lark-cli` provides a broad command system for Lark/Feishu: shortcuts, generated API commands, raw OpenAPI calls, authentication, schema introspection, and many business domains. `lark-axi` is a smaller wrapper designed for agent execution on top of that system.

Use `lark-cli` directly when you need:

- Full upstream command coverage.
- Exact raw output from the official tool.
- Interactive setup, login, scope selection, or schema exploration.
- Advanced upstream flags that are not yet modeled by `lark-axi`.

Use `lark-axi` when you need:

- Concise identity, calendar, message, document, task, sheet, base, or drive context.
- Guarded previews for message sending or document creation.
- A compact fallback over arbitrary `lark-cli` commands.

## Installation & Quick Start

### Requirements

- Node.js 20+
- `lark-cli` installed and available on `PATH`
- Lark/Feishu app configuration and authentication handled by `lark-cli`

## Installation

From npm after release:

```bash
npm install -g lark-axi
```

Without a global install:

```bash
npx -y lark-axi
```

Install or update the official CLI:

```bash
npx @larksuite/cli@latest install
```

Configure and log in:

```bash
lark-cli config init
lark-cli auth login --recommend
lark-cli auth status
```

Install `lark-axi` from this repository for local development:

```bash
git clone https://github.com/yantao006/lark-axi.git
cd lark-axi
npm install
npm run build
npm link
```

Verify:

```bash
lark-axi
lark-axi auth status
```

If `lark-cli` is installed outside `PATH`, point `lark-axi` at it explicitly:

```bash
export LARK_CLI_PATH=/absolute/path/to/lark-cli
lark-axi
```

## Agent Quick Start

For an agent operating in a shell session:

```bash
# 1. Inspect runtime, auth, and discovered domains
lark-axi

# 2. Confirm identity before reading or writing data
lark-axi auth status

# 3. Read compact context
lark-axi calendar agenda
lark-axi im search --query "project update"
lark-axi docs fetch --token <doc-token>

# 4. Preview mutations before execution
lark-axi im send --chat-id oc_xxx --text "hello" --dry-run
lark-axi docs create --title "Weekly" --content "# Progress" --dry-run
```

`lark-axi` never starts login automatically. If authentication is missing, ask the user to run:

```bash
lark-cli auth login --recommend
```

## Commands

| Command | Description |
| --- | --- |
| `lark-axi` | Show runtime, auth summary, discovered domains, and next-step hints. |
| `lark-axi auth status` | Show compact identity state. |
| `lark-axi calendar agenda` | List upcoming calendar events. |
| `lark-axi im search --query <text>` | Search messages. |
| `lark-axi im send --chat-id <id> --text <text> --dry-run\|--execute` | Preview or send a message. |
| `lark-axi docs fetch --token <token>` | Fetch a document preview. |
| `lark-axi docs create --title <title> --content <markdown> --dry-run\|--execute` | Preview or create a document. |
| `lark-axi drive search` | Delegate Drive search through generic read handling. |
| `lark-axi base records` | Delegate Base record listing through generic read handling. |
| `lark-axi sheets info` | Inspect spreadsheet metadata. |
| `lark-axi task list` | List tasks assigned to the current identity. |
| `lark-axi raw <lark-cli args...>` | Delegate uncovered operations to `lark-cli`. |

Global flags:

| Flag | Description |
| --- | --- |
| `--format json` | Render the `lark-axi` response as structured JSON. |
| `--full` | Disable text truncation. |
| `--fields a,b,c` | Keep only selected fields in row output. |
| `--limit N` | Cap row output. |
| `--profile <name>` | Forward a `lark-cli` profile when supported. |
| `--as user\|bot\|auto` | Forward identity selection when supported. |
| `--debug` | Include stack traces on stderr for local debugging. |

For `raw`, wrapper flags must appear before `raw`:

```bash
lark-axi --format json raw auth status
```

Flags after `raw` are passed to `lark-cli`:

```bash
lark-axi raw api GET /open-apis/calendar/v4/calendars
```

## Output Model

Default output is compact and optimized for agent consumption. It intentionally summarizes large upstream payloads instead of reproducing every field from `lark-cli`.

Examples:

```bash
lark-axi auth status
```

```text
auth:
  brand: feishu
  identity: user
  default_as: auto
  user: Example User
  note: ""
```

Use JSON when exact fields are needed:

```bash
lark-axi --format json auth status
```

Use the official CLI directly when you need byte-for-byte upstream output:

```bash
lark-cli auth status
```

## Command Coverage

`lark-axi` uses three practical layers:

1. **Curated wrappers**: stable, compact commands for common agent workflows.
2. **Generic reads**: small pass-through wrappers for useful read paths such as Drive, Base, Sheets, and Tasks.
3. **Raw fallback**: arbitrary `lark-cli` delegation for operations that are not yet modeled.

See [docs/capabilities.md](docs/capabilities.md) for the current coverage table.

Command help:

```bash
lark-axi im search --help
lark-axi help docs fetch
```

## Safety Model

`lark-axi` executes through `lark-cli`, so operations run under the identity and scopes configured there.

Default posture:

- It never performs login automatically.
- It surfaces current identity state before encouraging operations.
- Curated mutations require `--dry-run` or `--execute`.
- Required mutation inputs are validated before invoking `lark-cli`.
- Dependency stderr stays out of stdout unless `--debug` is requested.
- Compact previews are preferred before full body retrieval.

For more detail, see [docs/security.md](docs/security.md).

List commands include count metadata (`shown`, `total_observed`, `limit`) so agents can tell whether a compact response was capped. Detail commands truncate large text by default and include a `--full` escape hatch when content is truncated.

## Agent Skill

The installable skill lives at `skills/lark-axi/SKILL.md` and is generated from `src/skill/generate.ts`.

```bash
npm run skill:generate
npm run skill:check
```

## Development

```bash
npm install
npm run build
npm test
npm run skill:check
```

Run the CLI from source:

```bash
npm run dev -- --help
npm run dev -- auth status
```

Generate the bundled Agent Skill:

```bash
npm run skill:generate
```

Run the full local check:

```bash
npm run check
```

`lark-cli` remains the source of truth for auth, scopes, API coverage, pagination, schema introspection, and Feishu platform behavior. `lark-axi` is the agent interface layer on top.

## License

MIT.

When using `lark-axi`, you are also using `lark-cli` and Lark/Feishu Open Platform APIs. Make sure your usage complies with the applicable Lark/Feishu terms, privacy policies, and your organization's permission rules.
