# Security Notes

`lark-axi` executes through `lark-cli`, so Feishu/Lark operations run under the identity and scopes configured there.

Default posture:

- Never perform login automatically.
- Never hide current identity state.
- Require `--dry-run` or `--execute` for curated mutations.
- Validate required mutation inputs before invoking `lark-cli`.
- Keep dependency stderr out of stdout unless `--debug` is requested.
- Prefer previews and compact summaries before full body retrieval.

Use bot or user identity intentionally with `--as bot` or `--as user` when the upstream command supports it.
