# Security Notes

`lark-axi` executes through `lark-cli`, so Feishu/Lark operations run under the identity and scopes configured there.

Default posture:

- Never perform login automatically.
- Never hide current identity state.
- Require exactly one of `--dry-run` or `--execute` for curated mutations.
- Validate registry-required inputs before invoking `lark-cli`, including flags accidentally provided without a value.
- Keep dependency stderr out of stdout unless `--debug` is requested.
- Strip `[lark-cli] [WARN]` lines from error output.
- Extract structured upstream error fields (`type`, `message`, `hint`) from `lark-cli` JSON error responses when available.
- Include a structured `fix` action, failure `source`, and `retryable` marker on every error.
- Prefer previews and compact summaries before full body retrieval.

Use bot or user identity intentionally with `--as bot`, `--as user`, or `--as auto` when the upstream command supports it.

## Risk Classes

Registry-backed commands are classified before execution:

| Risk | Meaning | Examples |
| --- | --- | --- |
| read | Reads remote state or local CLI state. | `auth status`, `auth scopes`, `im chats`, `docs search`, `drive inspect`, `contact search` |
| write | Creates or updates remote state. | `docs create` |
| destructive | Deletes or irreversibly clears remote state. | Future delete routes after evidence exists. |
| permission | Changes or requests access to shared resources. | Future permission routes after evidence exists. |
| external-send | Sends content or invitations to other users. | `im send` |
| file-system | Reads or writes local files while interacting with Lark/Feishu resources. | Future upload/download routes after evidence exists. |

Write-like risk classes are blocked unless the caller supplies exactly one of `--dry-run` or `--execute`. Passing both flags is treated as a usage error.

Mutation responses identify mode, risk, identity, target, intended effect, and a verification hint. A dry run must not claim that the external side effect happened; an execute response should give the agent a concrete way to verify the result.

## Raw Fallback

`lark-axi raw <lark-cli args...>` remains available for uncovered operations. Raw calls are not blocked, because the purpose of raw is to preserve upstream access, but output help now nudges agents toward curated commands when a matching wrapper exists. If the matching wrapper is write-like, the help also shows the risk class and reminds agents that the curated route enforces preview or execution intent.
