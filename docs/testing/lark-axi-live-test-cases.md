# Lark AXI Live Test Cases

These cases validate `lark-axi` against the real local `lark-cli` profile. They are intentionally split into local checks, read-only live checks, dry-run mutation checks, and explicitly approved live writes.

Run local checks before any live call:

```bash
npm run check
```

The broader baseline and trial rules live in [docs/governance.md](../governance.md). The required order is offline help/usage checks, read-only live checks, dry-run checks, then explicitly approved `--execute` writes against disposable resources.

## Test Resources

Set these variables before running live cases. Use disposable resources only.

```bash
export LARK_AXI_DOC_TOKEN="EXrXdVDl8ovi3YxhN3pc2msanjc"
export LARK_AXI_IM_QUERY="测试"
export LARK_AXI_TEST_CHAT_ID="oc_a70985a83530f438ce33d6f9e0619fa4"
export LARK_AXI_TEST_MESSAGE_ID="om_x100b6c8050278c74c427bef59bd6e4c"
export LARK_AXI_TEST_MESSAGE="[lark-axi 测试] live smoke message"
```

Optional resources for broader generic-read coverage:

```bash
export LARK_AXI_DRIVE_QUERY=""
export LARK_AXI_BASE_ARGS=""
export LARK_AXI_SHEETS_ARGS=""
export LARK_AXI_MARKDOWN_ARGS=""
export LARK_AXI_CONTACT_QUERY=""
export LARK_AXI_DRIVE_INSPECT_ARGS=""
```

Do not store access tokens, refresh tokens, app secrets, session cookies, or tenant admin credentials in this file or in test logs.

## Required Cadence

After a significant change to command routing, adapters, output rendering, safety policy, curated command wrappers, generic wrappers, registry coverage, raw fallback behavior, or skill generation:

1. Run `npm run check`.
2. Run every non-destructive live case that has resources available.
3. Run dry-run cases before any write case.
4. Run write cases only after the user approves the exact command, target, identity, and text/content, and only against disposable resources.
5. Record failures as one of: wrapper bug, missing scope, missing resource, upstream `lark-cli` behavior, or intentional unsupported coverage.

## Cases

| ID | Area | Command | Expected Result | Risk |
| --- | --- | --- | --- | --- |
| T1 | Local install | `npm install && npm run check` | Dependencies install, build passes, unit tests pass, skill check passes. | none |
| T2 | Runtime dashboard | `npm run dev --` | Shows `lark-axi` binary path, description, `lark-cli` binary path/version, auth summary, discovered domains, and update hint when stale. | read-only |
| T3 | Auth | `npm run dev -- auth status --format json` | JSON render contains `status`, `command`, command metadata, brand, identity, default identity, user, and remediation next action only when needed. | read-only |
| T4 | Calendar | `npm run dev -- calendar agenda --limit 3 --format json` | Returns compact event rows or explicit `0 upcoming calendar events`. | read-only |
| T5 | IM search | `npm run dev -- im search --query "$LARK_AXI_IM_QUERY" --limit 2 --format json` | Returns compact message rows; should not return the full upstream envelope as a row. | read-only |
| T6 | Docs fetch | `npm run dev -- docs fetch --token "$LARK_AXI_DOC_TOKEN" --format json` | Returns title/char count/content preview from `data.document.content`; content should not be empty for the known test doc. | read-only |
| T7 | Drive search | `npm run dev -- drive search --query "$LARK_AXI_DRIVE_QUERY" --limit 2 --format json` | Returns normalized rows or a classified missing-scope/resource error. | read-only |
| T8 | Base records | `npm run dev -- base records $LARK_AXI_BASE_ARGS --limit 2 --format json` | Returns normalized records or a classified missing-resource/error. | read-only |
| T9 | Sheets info | `npm run dev -- sheets info $LARK_AXI_SHEETS_ARGS --format json` | Returns spreadsheet metadata or a classified missing-resource/error. | read-only |
| T10 | Task list | `npm run dev -- task list --limit 3 --format json` | Returns assigned tasks or explicit empty state. | read-only |
| T11 | Raw fallback | `npm run dev -- raw im +messages-mget --message-ids "$LARK_AXI_TEST_MESSAGE_ID" --as bot --format json` | Delegates to `lark-cli`, applies `--limit` (default 20) slicing, prepends count metadata (`shown`, `total_observed`, `limit`), returns the test message, and suggests curated commands when applicable. | read-only |
| T12a | Per-command help | `npm run dev -- im search --help` and `npm run dev -- help docs fetch` | Shows command-specific usage, flags, and examples for the requested command; does not show the global command list. | none |
| T13 | Safety block | `npm run dev -- im send --chat-id "$LARK_AXI_TEST_CHAT_ID" --text "$LARK_AXI_TEST_MESSAGE" --as bot --format json` | Fails before invoking `lark-cli` with `status:error`, `source:wrapper`, and `error.fix.missing` naming `dry-run` and `execute`. | no write |
| T14 | IM dry-run | `npm run dev -- im send --chat-id "$LARK_AXI_TEST_CHAT_ID" --text "$LARK_AXI_TEST_MESSAGE" --dry-run --as bot --format json`; repeat with `--markdown "# test"` when disposable content is available. | Shows mode, risk, identity, target, intended effect, and planned request; does not send a message. Rich content sends route through the registry-backed mutation path. | dry-run |
| T15 | Docs dry-run | `npm run dev -- docs create --title "lark-axi dry run" --content "hello" --dry-run --format json` | Shows mode, risk, identity, target, intended effect, and planned document create request; does not create a document. | dry-run |
| T16 | IM execute | `npm run dev -- im send --chat-id "$LARK_AXI_TEST_CHAT_ID" --text "$LARK_AXI_TEST_MESSAGE" --execute --as bot --format json` | Sends exactly one approved message, returns message metadata, and includes a verification next action. | write |
| T17 | Docs execute | `npm run dev -- docs create --title "lark-axi live test" --content "hello" --execute --format json` | Creates exactly one approved disposable document, returns a fetchable token/URL, and includes a verification next action. | write |
| T18 | Output controls | Repeat T5/T6 with `--fields`, `--limit`, and `--full`. | Output flags change shape or truncation without breaking command behavior. | read-only |
| T19 | Identity routing | Repeat representative reads with `--as user` and `--as bot` where upstream supports both. | Identity is forwarded and differences are visible in output or classified errors. | read-only |
| T20 | Error normalization | Use an invalid doc token and invalid chat id. | Returns stable AXI errors with `source`, `retryable`, and `fix` fields; no stack traces unless `--debug` is set; should not include unparsed proxy warnings or full upstream envelopes as the primary message. | read-only |
| T21 | Raw contact search | `npm run dev -- raw contact +search-user --query "$LARK_AXI_CONTACT_QUERY" --limit 2 --format json` | Delegates through raw fallback and returns user rows or a classified missing-scope/resource error. | read-only |
| T22 | Raw IM chat lookup | `npm run dev -- raw im +chat-search --query "$LARK_AXI_IM_QUERY" --limit 2 --format json` | Delegates through raw fallback and returns chat rows with usable chat IDs or a classified empty/permission state. | read-only |
| T23 | Raw Drive inspect | `npm run dev -- raw drive +inspect $LARK_AXI_DRIVE_INSPECT_ARGS --format json` | Delegates through raw fallback and returns resource type, title, and canonical token where upstream can inspect the target. | read-only |
| T24 | Registry mutation safety | Run `npm run dev -- im send --chat-id "$LARK_AXI_TEST_CHAT_ID" --markdown "# test" --dry-run --execute --format json` and `npm run dev -- docs create --title "missing approval" --content "hello" --format json`. | Each fails before invoking a live write and names the approval problem. | no write |
| T24a | IM content validation | Run `npm run dev -- im send --chat-id "$LARK_AXI_TEST_CHAT_ID" --text hello --markdown "# test" --dry-run --format json` and `npm run dev -- im send --chat-id "$LARK_AXI_TEST_CHAT_ID" --markdown --dry-run --format json`. | Each fails before invoking `lark-cli`; the first names the conflicting content flags and the second names the missing usable content flag. | no write |
| T25 | Raw curated hint | `npm run dev -- --format json raw im +messages-send --chat-id "$LARK_AXI_TEST_CHAT_ID" --text "$LARK_AXI_TEST_MESSAGE" --dry-run` | Delegates to raw upstream dry-run and prints a hint preferring `lark-axi im send` plus the `external-send` risk. | dry-run |

## Regression Coverage

- `docs fetch` must normalize `data.document.content` and force the v2 docs API.
- `im search` must normalize `data.messages` into compact message rows.
- Missing-scope errors must extract upstream `error.type`, `error.message`, and `error.hint` without proxy warnings or update envelopes.
- Every success response must include `status`, `command`, and command metadata; every error response must include `source`, `retryable`, and `fix`.
- Mutation responses must identify mode, risk, identity, target, intended effect, and a verification-oriented next action.
- All list commands (calendar agenda, im search, drive search, base records, sheets info, task list, raw) must prepend a count metadata section with `shown`, `total_observed`, and `limit`.
- New curated/generic commands must not be added to this file or the registry without evidence: upstream argument/output fixtures, wrapper tests, safety tests for write-like routes, executable help examples, and documentation/skill updates.
