---
title: "test: Validate Lark AXI Real Operations"
type: test
date: 2026-06-24
---

# test: Validate Lark AXI Real Operations

## Summary

Run a staged, realistic operation test for `lark-axi` against the installed `lark-cli`, starting with local build and authentication checks, then exercising read-only commands, dry-run mutations, and a small set of approved writes against disposable Lark/Feishu resources.

---

## Problem Frame

`lark-axi` already has unit tests around parsing, rendering, safety gates, discovery, and adapter behavior, but it has not been proven against a live Lark/Feishu tenant. The test needs to validate the wrapper's real behavior without broad production access, accidental messages, or credential exposure.

Current local context:

- `lark-cli` is installed and available on `PATH`.
- Installed `lark-cli` version is `1.0.32`.
- `lark-cli auth status` reports Feishu brand and a valid user token for the default profile.
- Local dependencies are installed and `npm run check` passes.
- Live test cases have been captured in `docs/testing/lark-axi-live-test-cases.md`.

---

## Requirements

- R1. Verify `lark-axi` can build and pass local test suites before any live calls.
- R2. Verify the wrapper detects `lark-cli`, version, auth state, capability inventory, and update hints.
- R3. Exercise every currently exposed curated command against real Lark/Feishu state where safe.
- R4. Exercise generic read pass-through commands for Drive, Base, Sheets, Task, and Markdown when test resources exist.
- R5. Verify mutation safety gates block writes without `--dry-run` or `--execute`.
- R6. Verify dry-run mutations show the intended request without creating external side effects.
- R7. Execute at most two approved write operations against disposable resources: one test IM message and one test document creation.
- R8. Record permission, missing-scope, empty-state, and upstream-shape failures as wrapper findings rather than silently treating them as test failures.

---

## Key Technical Decisions

- KTD1. Use `lark-cli` auth as the credential boundary: do not paste `user_access_token`, `refresh_token`, or app secrets into chat; prefer the user running `lark-cli auth login --recommend` locally when user identity is needed.
- KTD2. Test reads before writes: calendar, docs fetch, IM search, and generic read commands establish auth and output behavior before any operation can create content.
- KTD3. Keep writes disposable and explicit: the only planned `--execute` operations are sending a known test message to a test chat and creating a test doc with harmless content.
- KTD4. Treat identity as an explicit test dimension: user identity is available in the default profile, while bot identity still requires target chat membership and app-level permissions.
- KTD5. Use exact live `lark-cli` help/schema output when confirming scopes: Lark permissions and command names change, so live schema/help from the installed CLI is more reliable than hardcoded scope names in the plan.

---

## Test Matrix

| ID | Area | Command Surface | Expected Result | Risk |
| --- | --- | --- | --- | --- |
| T1 | Local install | `npm install`, `npm run build`, `npm test` | Build and unit tests pass | none |
| T2 | Runtime dashboard | `lark-axi` | Compact runtime, auth, domains, and help output | read-only |
| T3 | Auth | `lark-axi auth status` | Identity, brand, default identity, and remediation hint render clearly | read-only |
| T4 | Calendar | `lark-axi calendar agenda` | Upcoming events or explicit empty state | read-only |
| T5 | IM search | `lark-axi im search --query <keyword>` | Compact message rows or permission/empty state | read-only |
| T6 | Docs fetch | `lark-axi docs fetch --token <doc_token>` | Title, char count, truncated preview, `--full` hint if needed | read-only |
| T7 | Drive search | `lark-axi drive search --query <keyword>` | Rows from generic read renderer or permission error | read-only |
| T8 | Base records | `lark-axi base records <test args>` | Rows from a disposable Base table | read-only |
| T9 | Sheets info | `lark-axi sheets info <test args>` | Spreadsheet metadata normalized by generic read | read-only |
| T10 | Task list | `lark-axi task list` | Assigned tasks or explicit empty state | read-only |
| T11 | Markdown fetch | `lark-axi markdown fetch <test args>` | Markdown content or raw wrapper output | read-only |
| T12 | Raw fallback | `lark-axi raw api GET /open-apis/calendar/v4/calendars` | Raw rows with curated-command hint | read-only |
| T13 | Safety block | `lark-axi im send --chat-id <id> --text <text>` | Usage error requiring `--dry-run` or `--execute` | no write |
| T14 | IM dry-run | `lark-axi im send --chat-id <id> --text <text> --dry-run` | Planned request, no message sent | dry-run |
| T15 | Docs dry-run | `lark-axi docs create --title <title> --content <content> --dry-run` | Planned request, no doc created | dry-run |
| T16 | IM execute | `lark-axi im send --chat-id <test_chat_id> --text <approved_text> --execute` | One message appears in the test chat | write |
| T17 | Docs execute | `lark-axi docs create --title <title> --content <content> --execute` | One disposable doc is created and fetchable | write |
| T18 | Output controls | Add `--format json`, `--fields`, `--limit`, `--full` | Output flags change shape without breaking command behavior | read-only |
| T19 | Identity routing | Repeat key reads with `--as user` and `--as bot` where supported | User/bot differences are clear and forwarded | read-only |
| T20 | Error normalization | Use an invalid token/chat/query argument | Stable AXI error shape, no raw stack unless `--debug` | read-only |

---

## Required Access From User

### Minimum for meaningful read-only testing

- Permission for me to run local commands in this repo and call the configured `lark-cli` profile.
- A completed `lark-cli` user login if we need user-only behavior:

```bash
lark-cli auth login --recommend
```

- The profile name if testing should not use the default profile.
- One search keyword that should return at least one visible message.
- One readable document token for `docs fetch`.
- One calendar date range or confirmation that today's agenda is enough.

### Required for controlled write testing

- A disposable test chat ID where sending one test message is acceptable.
- Exact message text approved for sending.
- Approval to create one disposable test document.
- A naming prefix for created artifacts, for example `lark-axi-test-2026-06-24`.

### Optional for broader coverage

- A Drive search keyword or disposable Drive folder token.
- A Base app token, table ID, and a small table with non-sensitive records.
- A spreadsheet token for `sheets info`.
- A task assigned to the logged-in user, or permission to observe an empty task state.
- A markdown/cloud-doc token if `markdown fetch` should be covered.

### Do Not Provide in Chat

- Do not paste `user_access_token`, `refresh_token`, app secret, session cookies, or tenant admin credentials into chat.
- If app credentials are truly required, configure them through `lark-cli auth login` or a local profile outside the transcript, then let the test use that profile.

---

## Implementation Units

### U1. Local Toolchain and Baseline

- **Goal:** Prepare the repo and prove local test/build health before live operations.
- **Requirements:** R1.
- **Files:** `package.json`, `package-lock.json`, `test/cli.test.ts`, `test/adapter.test.ts`, `test/discovery.test.ts`, `test/output.test.ts`, `test/safety.test.ts`.
- **Approach:** Install dependencies, run `npm run build`, `npm test`, and `npm run skill:check`.
- **Test scenarios:** Missing dependency state is documented; after install, TypeScript build succeeds; unit tests pass; skill generation remains deterministic.
- **Verification:** Local checks pass without requiring Lark/Feishu credentials.

### U2. Auth, Version, and Capability Preflight

- **Goal:** Confirm `lark-axi` sees the same runtime and identity state as `lark-cli`.
- **Requirements:** R2, R8.
- **Files:** `src/cli.ts`, `src/commands/auth.ts`, `src/lark/adapter.ts`, `src/lark/discovery.ts`.
- **Approach:** Compare `lark-cli --version`, `lark-cli auth status`, `lark-cli --help`, `lark-axi`, and `lark-axi auth status`.
- **Test scenarios:** Current user-authenticated state is rendered accurately; missing user token produces remediation when applicable; discovered domains align with `lark-cli --help`; stale version hint is not misleading.
- **Verification:** No command mutates Lark/Feishu state.

### U3. Curated Read Commands

- **Goal:** Validate real read operations and compact rendering for first-class wrappers.
- **Requirements:** R3, R8.
- **Files:** `src/commands/calendar.ts`, `src/commands/im.ts`, `src/commands/docs.ts`, `src/output/render.ts`, `src/output/truncate.ts`.
- **Approach:** Run calendar agenda, IM search, docs fetch, and output-control variants against known visible resources.
- **Test scenarios:** Non-empty results render expected fields; empty results are explicit; permission errors preserve actionable context; long doc content truncates unless `--full` is set.
- **Verification:** Results are compared against raw `lark-cli` calls for the same resources.

### U4. Generic Read and Raw Fallback

- **Goal:** Validate pass-through wrappers for domains that are not yet curated.
- **Requirements:** R4, R8.
- **Files:** `src/commands/generic.ts`, `src/commands/raw.ts`, `src/commands/common.ts`.
- **Approach:** Run Drive search, Base records, Sheets info, Task list, Markdown fetch, and one raw API call when matching test resources exist.
- **Test scenarios:** Extra flags forward correctly; `--profile`, `--as`, `--fields`, and `--limit` behave consistently; unsupported arguments fail as upstream errors with wrapper normalization.
- **Verification:** Each generic command either returns normalized rows or a clearly classified missing-scope/resource error.

### U5. Mutation Safety and Dry Runs

- **Goal:** Prove writes cannot happen accidentally.
- **Requirements:** R5, R6.
- **Files:** `src/safety/policy.ts`, `src/commands/im.ts`, `src/commands/docs.ts`, `test/safety.test.ts`.
- **Approach:** Attempt mutation commands without execution flags, then repeat with `--dry-run`.
- **Test scenarios:** Missing `--dry-run`/`--execute` fails before `lark-cli` invocation; dry-run reaches upstream preview but does not create a message or doc; missing required args fail before upstream invocation.
- **Verification:** No new test chat message or document exists after dry-run cases.

### U6. Approved Live Writes

- **Goal:** Validate the end-to-end write path with bounded blast radius.
- **Requirements:** R7, R8.
- **Files:** `src/commands/im.ts`, `src/commands/docs.ts`, `src/lark/adapter.ts`, `src/output/render.ts`.
- **Approach:** Send one approved message to a disposable chat and create one disposable document, then fetch or inspect each result.
- **Test scenarios:** IM send returns a message record or success record; docs create returns a doc token or success record; follow-up reads can verify the created object; duplicate execution is avoided.
- **Verification:** User confirms the test message/doc are acceptable artifacts or provides cleanup instructions.

### U7. Findings and Follow-Up Backlog

- **Goal:** Turn live-test failures into actionable code, docs, or compatibility findings.
- **Requirements:** R8.
- **Files:** `README.md`, `docs/capabilities.md`, `docs/security.md`, relevant `src/commands/*.ts`, relevant `test/*.test.ts`.
- **Approach:** Classify each live-test failure as missing permission, upstream CLI mismatch, wrapper bug, docs gap, or unsupported feature.
- **Test scenarios:** Scope/resource failures are not confused with wrapper bugs; wrapper output mismatches get fixture tests; unsupported upstream behavior is documented in capability coverage.
- **Verification:** The test report identifies which commands are production-ready, blocked by auth/resource setup, or need code changes.

---

## Execution Order

1. Install dependencies and run local build/tests.
2. Capture `lark-cli` and `lark-axi` auth/version/capability state.
3. Run all read-only tests that the current user identity can support.
4. Run bot-identity reads only against chats/resources where the bot is already a member or has app-level access.
5. Run user/bot identity-routing checks.
6. Run mutation safety failures and dry-run previews.
7. Ask for explicit approval of exact IM/doc write commands.
8. Execute the two approved writes and verify them.
9. Summarize pass/fail/blocker status and create follow-up fixes if needed.

---

## Scope Boundaries

### In Scope

- Real `lark-axi` calls through the installed `lark-cli`.
- Current wrapper commands listed in `README.md` and `docs/capabilities.md`.
- User and bot identity differences where the profile supports them.
- Permission and missing-resource failure classification.

### Out of Scope

- Broad tenant administration changes.
- Production chat/document writes.
- Storing or handling raw tokens in the repository or transcript.
- Full coverage of every `lark-cli` domain.
- Reimplementing OpenAPI calls directly in `lark-axi`.

---

## Risks and Dependencies

- **Permission drift:** Lark scopes and `lark-cli` command surfaces evolve. Live `lark-cli help/schema` output should be captured during testing.
- **Identity confusion:** User and bot identities have different resource visibility and chat membership. Bot write tests need preflight checks for chat membership.
- **Side effects:** Write tests must target disposable resources and use exact approved text/title/content.
- **Local dependency state:** Re-run `npm install` if `node_modules` is missing, then run `npm run check`.
- **Upstream version mismatch:** The wrapper's known latest value is `1.0.57`, while local `lark-cli` is `1.0.32`; behavior differences should be classified separately from wrapper bugs.

---

## Sources and Research

- `README.md`
- `docs/capabilities.md`
- `docs/security.md`
- `src/cli.ts`
- `src/commands/auth.ts`
- `src/commands/calendar.ts`
- `src/commands/im.ts`
- `src/commands/docs.ts`
- `src/commands/generic.ts`
- `src/commands/raw.ts`
- `src/safety/policy.ts`
- `docs/plans/2026-06-24-001-feat-lark-axi-wrapper-plan.md`
- Lark Developer scope list: https://open.larksuite.com/document/ukTMukTMukTM/uYTM5UjL2ETO14iNxkTN/scope-list
- Lark OpenAPI MCP documentation: https://open.feishu.cn/document/mcp_open_tools/mcp-overview
