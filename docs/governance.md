# Verification and Coverage Governance

This repository is not ready for stable trial or release from `main`. Continue the wrapper from the selected integration baseline until the release owner says otherwise:

```bash
git fetch origin feat/lark-axi-wrapper
test "$(git rev-parse origin/feat/lark-axi-wrapper)" = "4484fd9e6a7a419244c87033fc0217ff6a3b60c5"
git checkout -b <feature-branch> origin/feat/lark-axi-wrapper
```

Do not resume from stale local branch heads. In particular, the previously observed local `feat/agent-ergonomic-contracts@53a5f2d` is older than the no-mistakes-corrected remote work and does not contain the selected integration state. Treat `origin/feat/lark-axi-wrapper@4484fd9e6a7a419244c87033fc0217ff6a3b60c5` as the continuation baseline because it already includes the command registry and agent response contract work that was merged through PR #6 and PR #7.

## Local Verification

Run the full local gate after any significant change to command routing, adapters, output rendering, safety policy, curated command wrappers, generic wrappers, raw fallback behavior, docs, IM behavior, registry coverage, or skill generation:

```bash
npm run check
```

`npm run check` builds TypeScript, runs Vitest, and verifies the generated skill. It does not require Lark/Feishu credentials and must pass before live checks or PR validation.

## Non-Destructive Trial Path

Use this sequence for agent trials. Stop at the first phase that is not explicitly authorized or lacks disposable resources.

| Phase | Commands | Credentials | Side effects |
| --- | --- | --- | --- |
| Offline help and usage | `npm run check`; `npm run dev -- --help`; `npm run dev -- help docs fetch`; `npm run dev -- im send --chat-id oc_xxx --text hello --format json` | None | None; mutation usage errors must be blocked before `lark-cli` runs. |
| Read-only live | `npm run dev -- auth status --format json`; representative read commands from `docs/testing/lark-axi-live-test-cases.md` | Existing `lark-cli` login and scopes | Reads only. Classify missing scopes/resources without changing data. |
| Dry-run live | `npm run dev -- im send ... --dry-run --format json`; `npm run dev -- docs create ... --dry-run --format json` | Existing `lark-cli` login and disposable targets | No writes; validates wrapper planning and upstream dry-run behavior. |
| Execute/write | Exact `--execute` command approved by the user or captain | Explicit identity, target, and disposable resource approval | Writes exactly the approved content to the approved disposable target. |

Never run live network tests for ordinary local verification. Never run `--execute` or any real write side effect without explicit approval of the exact command, target, identity, and message/content. Classify live failures as wrapper bug, missing scope, missing resource, upstream `lark-cli` behavior, or intentionally unsupported coverage before changing code.

## Command Coverage Checklist

New Lark command coverage is incomplete until all applicable evidence lands in the same change:

| Requirement | Evidence |
| --- | --- |
| Registry entry | `src/commands/registry.ts` entry with status, risk class, response kind, usage, flags, executable examples, required flags, upstream shortcut when registry-backed, and sensible default fields for list output. |
| Realistic fixture | A representative upstream argument/output fixture or inline mocked response shaped like current `lark-cli` output, including real identifier forms such as `oc_xxx`, `om_xxx`, `doc_xxx`, `bas_xxx`, `tbl_xxx`, or `sht_xxx` where relevant. |
| Routing and normalization tests | Vitest coverage proving wrapper arguments route to the intended `lark-cli` shortcut, required flags reject missing or bare values before `lark-cli` runs, and output normalizes into the expected record/list/mutation envelope without leaking broad upstream envelopes as rows. |
| Safety tests | For write-like, destructive, permission, external-send, or file-system commands: tests proving missing target/content and missing or conflicting `--dry-run`/`--execute` fail before the adapter is called. |
| Help examples | `lark-axi --help` and `lark-axi help <command>` expose executable examples and usable ID-shape hints. |
| Documentation sync | Update `README.md`, `README.zh.md`, `docs/capabilities.md`, `docs/security.md` when safety or risk changes, and `docs/testing/lark-axi-live-test-cases.md` with offline/read-only/dry-run/execute expectations. |
| Skill sync | Update `src/skill/generate.ts`, regenerate `skills/lark-axi/SKILL.md`, and keep `npm run skill:check` passing. |

If any checklist row is missing, leave the command raw-first and document the gap instead of expanding the public wrapper surface.
