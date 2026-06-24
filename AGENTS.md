# AGENTS.md

## Project Rules

- Use `npx -y gh-axi` for GitHub operations in this repository.
- Use `lark-axi` for Lark/Feishu validation in this repository. `lark-cli` may be used as the upstream oracle, but it is not a substitute for testing the wrapper.
- After any significant change to command routing, adapters, output rendering, safety policy, curated command wrappers, generic wrappers, docs, IM, or skill generation, run `npm run check`.
- For significant behavior changes, also run the applicable live test cases in `docs/testing/lark-axi-live-test-cases.md` against disposable Lark/Feishu resources.
- Never run live write cases without explicit user approval of the exact command, target, identity, and message/content.
- Classify live-test failures as wrapper bug, missing scope, missing resource, upstream `lark-cli` behavior, or intentionally unsupported coverage before changing code.
