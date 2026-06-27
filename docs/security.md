# Security Notes

`lark-axi` executes through `lark-cli`, so Feishu/Lark operations run under the identity and scopes configured there.

Default posture:

- Never perform login automatically.
- Never hide current identity state.
- Require exactly one of `--dry-run` or `--execute` for curated mutations.
- Validate required mutation inputs before invoking `lark-cli`.
- Keep dependency stderr out of stdout unless `--debug` is requested.
- Strip `[lark-cli] [WARN]` lines from error output.
- Extract structured upstream error fields (`type`, `message`, `hint`) from `lark-cli` JSON error responses when available.
- Include a structured `fix` action, failure `source`, and `retryable` marker on every error.
- Prefer previews and compact summaries before full body retrieval.

Use bot or user identity intentionally with `--as bot`, `--as user`, or `--as auto` when the upstream command supports it.

## Input Validation

Registry-backed commands validate required wrapper inputs before invoking `lark-cli`. For example, `drive search` requires a non-empty `--query`, and `im send` requires either `--chat-id oc_xxx` or `--user-id <user_id>` plus exactly one content flag from `--text`, `--markdown`, `--content`, `--image`, `--file`, `--video`, or `--audio`.

## Risk Classes

Registry-backed commands are classified before execution:

| Risk | Meaning | Examples |
| --- | --- | --- |
| read | Reads remote state or local CLI state. | `auth status`, `docs fetch`, `im search`, `drive search` |
| write | Creates or updates remote state. | `docs create` |
| destructive | Deletes or irreversibly clears remote state. | Future delete routes after evidence exists. |
| permission | Changes or requests access to shared resources. | Future permission routes after evidence exists. |
| external-send | Sends content or invitations to other users. | `im send` |
| file-system | Reads or writes local files while interacting with Lark/Feishu resources. | Future upload/download routes after evidence exists. |

Write-like risk classes are blocked unless the caller supplies `--dry-run` or `--execute`. Passing both flags is treated as a usage error.

Mutation responses identify mode, risk, identity, target, intended effect, and a verification hint. A dry run must not claim that the external side effect happened; an execute response should give the agent a concrete way to verify the result.

## Error Sources

Every error includes `source`, `retryable`, and `fix` fields:

| Source | Meaning | Retryable |
| --- | --- | --- |
| wrapper | `lark-axi` rejected missing or conflicting arguments before calling `lark-cli`. | no |
| dependency | `lark-cli` is missing or failed locally before a Lark/Feishu API response. | no |
| auth | Upstream reported missing or invalid authentication. | no |
| scope | Upstream reported missing permissions or scopes. | no |
| upstream_usage | Upstream rejected command syntax or flags. | no |
| upstream_service | Upstream service or platform failure after a valid invocation. | yes |
| timeout | `lark-cli` did not finish before the wrapper timeout. | yes |
| unknown | Reserved fallback for unclassified failures. | no |

## Raw Fallback

`lark-axi raw <lark-cli args...>` remains available for uncovered operations. Raw calls are not blocked, because the purpose of raw is to preserve upstream access, but output help now nudges agents toward curated commands when a matching wrapper exists. If the matching wrapper is write-like, the help also shows the risk class and reminds agents that the curated route enforces preview or execution intent.
