# Capability Coverage

`lark-axi` now tracks coverage at command level instead of marking an entire `lark-cli` domain as curated after one wrapper exists. The runtime dashboard still shows top-level domains, but command help and this document distinguish curated, generic, raw-only, deprecated, and intentionally unsupported coverage.

## Coverage Classes

| Class | Meaning |
| --- | --- |
| curated | Stable AXI route with compact output, documented help, and wrapper-level safety where applicable. |
| generic | Stable AXI route that forwards to a known `lark-cli` shortcut and normalizes rows/records. |
| raw-only | Use `lark-axi raw <lark-cli args...>` until a stable wrapper is added. |
| deprecated | Kept only for compatibility; new docs should point to the current route. |
| unsupported | Intentionally outside the wrapper surface. |

## Practical Wrapper Surface

| Domain | Wrapper commands |
| --- | --- |
| auth / health | `auth status`, `auth scopes`, `auth users`, `doctor` |
| calendar | `calendar agenda` |
| im | `im search`, `im chats`, `im chat-search`, `im send` |
| docs | `docs fetch`, `docs search`, `docs create` |
| drive / markdown | `drive search`, `drive inspect`, `markdown fetch` |
| base | `base records` |
| sheets | `sheets info` |
| task | `task list` |
| contact | `contact search` |
| raw | `raw <lark-cli args...>` |

## Output Structure

Every response has a stable envelope in both compact and JSON modes:

- `status`: `ok` or `error`
- `command`: the wrapper command that produced the response
- `metadata`: command status, risk class, response kind, and command-specific mode when useful
- `sections`: records, rows, or text blocks
- `next_actions`: concrete follow-up commands or verification hints
- `error.fix`: the specific remediation for failures

List commands prepend count metadata with `shown`, `total_observed`, and `limit` fields so agents can detect capped responses. Detail and mutation commands render compact records. Long string fields in generic read rows are truncated by default and include `<field>_chars` metadata. Large nested values in compact output are bounded so raw or preview payloads do not dominate the context window.

Use `--format json` when exact machine-readable sections are needed. Use `--full` only after a preview proves the full body is needed.

Mutation responses include lifecycle metadata: mode, risk, identity, target, intended effect, upstream result, and a verification-oriented next action.

## Safety Classes

Registry-backed commands carry a risk class:

| Risk | Examples | Wrapper behavior |
| --- | --- | --- |
| read | `auth scopes`, `im chats`, `docs search`, `drive inspect`, `contact search` | No mutation approval required; required flags must have non-empty values. |
| write | `docs create` | Requires `--dry-run` or `--execute`. |
| destructive | Future delete routes after evidence exists. | Requires `--dry-run` or `--execute` and labels the risk in output/errors. |
| permission | Future permission routes after evidence exists. | Requires `--dry-run` or `--execute`. |
| external-send | `im send` | Requires `--dry-run` or `--execute`. |
| file-system | Future upload/download routes after evidence exists. | Requires `--dry-run` or `--execute`. |

Write-like risk classes require exactly one of `--dry-run` or `--execute`; passing both is a usage error.

`raw` remains an escape hatch. When the raw arguments match a known curated upstream shortcut, output help suggests the corresponding `lark-axi` command. When that command is write-like, raw output also shows the risk and points out that the curated wrapper enforces `--dry-run` or `--execute`.

## Error Normalization

Upstream `lark-cli` errors are cleaned before display:

- `[lark-cli] [WARN]` lines are stripped from stderr.
- Structured upstream error JSON (`{error: {type, message, hint}}`) is parsed and surfaced as the primary error fields.
- When no structured error is found, combined stdout/stderr is used as the error message.
- AXI-level validation errors are surfaced before invoking `lark-cli`, including missing or bare required value flags.
- Every error includes `source`, `retryable`, and `fix` fields so agents can decide whether to correct arguments, authenticate, request scopes, retry, or inspect upstream help.

## Remaining Raw-First Areas

The wrapper still leaves calendar writes, IM reply/message detail/download, docs update/media, drive upload/download/delete/permissions, Base/Sheets writes and schema reads, task writes/search, contact detail, mail, meetings, minutes, notes, wiki, specialized apps, approval, OKR, attendance, event streaming, slides, whiteboard, and generated OpenAPI command groups behind `raw`.

Add curated or generic registry coverage only when the command has evidence: realistic upstream argument/output fixtures, wrapper routing or normalization tests, safety tests for write-like routes, executable help examples, and documentation/skill updates. Use the full checklist in [docs/governance.md](governance.md); if the checklist is incomplete, keep the command raw-first.
