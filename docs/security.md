# Security Notes

`lark-axi` executes through `lark-cli`, so Feishu/Lark operations run under the identity and scopes configured there.

Default posture:

- Never perform login automatically.
- Never hide current identity state.
- Require `--dry-run` or `--execute` for curated mutations.
- Validate required mutation inputs before invoking `lark-cli`.
- Keep dependency stderr out of stdout unless `--debug` is requested.
- Strip `[lark-cli] [WARN]` lines from error output.
- Extract structured upstream error fields (`type`, `message`, `hint`) from `lark-cli` JSON error responses when available.
- Prefer previews and compact summaries before full body retrieval.

Use bot or user identity intentionally with `--as bot`, `--as user`, or `--as auto` when the upstream command supports it.
