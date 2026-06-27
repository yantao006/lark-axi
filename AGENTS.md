# AGENTS.md

## Project Tools

- Use `npx -y gh-axi` for GitHub operations in this repository.
- Use `lark-axi` for Lark/Feishu validation in this repository. `lark-cli` may be used as the upstream oracle, but it is not a substitute for testing the wrapper.
- Continue this wrapper from `origin/feat/lark-axi-wrapper@4484fd9e6a7a419244c87033fc0217ff6a3b60c5` until the release owner selects a newer integration baseline. Do not resume from stale local branch heads such as the previously observed `feat/agent-ergonomic-contracts@53a5f2d`.

## Command Surface

- Add or change wrapper command coverage through `src/commands/registry.ts` when the route can be registry-backed; do not create separate command lists in routing, help, docs, or skill generation when the registry can be the source of truth.
- A command may enter curated/generic registry coverage only with evidence: realistic upstream argument/output fixtures, wrapper routing or normalization tests, safety tests for write-like commands, executable help examples, and docs/skill updates.
- Keep command help executable: examples and hints must use real wrapper syntax and real identifier shapes such as `oc_xxx` chat IDs.
- Preserve `raw` pass-through semantics. Wrapper flags such as `--format`, `--fields`, and `--limit` must appear before `raw`; every flag after `raw` belongs to upstream `lark-cli`.
- For list-style output, keep count metadata (`shown`, `total_observed`, `limit`) and write tests that identify sections by name or shape rather than fragile array indexes.
- Normalize upstream envelopes with realistic `lark-cli` fixtures; avoid broad row-unwrapping changes that silently alter unrelated commands.

## Safety

- Registry-backed write-like commands must declare an explicit risk class (`write`, `destructive`, `permission`, `external-send`, or `file-system`).
- Validate required target/content inputs before invoking `lark-cli`, and test that missing inputs do not call the adapter.
- Curated mutations must require exactly one of `--dry-run` or `--execute`; passing both is a usage error.
- Never run live write cases without explicit user approval of the exact command, target, identity, and message/content.

## Documentation and Skill Sync

- User-facing command, help, safety, output, or coverage changes must update the relevant docs: `README.md`, `README.zh.md`, `docs/capabilities.md`, `docs/security.md`, and/or `docs/testing/lark-axi-live-test-cases.md`.
- `skills/lark-axi/SKILL.md` is generated. Update `src/skill/generate.ts` and regenerate/check the skill instead of hand-editing the generated file as the only source.

## Verification

- After any significant change to command routing, adapters, output rendering, safety policy, curated command wrappers, generic wrappers, docs, IM, registry coverage, raw fallback behavior, or skill generation, run `npm run check`.
- Follow `docs/governance.md` for the selected baseline, local verification gate, non-destructive trial path, and command-coverage checklist.
- For significant behavior changes, also run the applicable live test cases in `docs/testing/lark-axi-live-test-cases.md` against disposable Lark/Feishu resources.
- Classify live-test failures as wrapper bug, missing scope, missing resource, upstream `lark-cli` behavior, or intentionally unsupported coverage before changing code.
