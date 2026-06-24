# Capability Coverage

`lark-axi` starts with curated wrappers for high-value agent workflows and leaves a raw fallback for the rest of `lark-cli`.

| Domain | Status | Notes |
| --- | --- | --- |
| auth | curated | `auth status` summarizes identity and remediation. |
| calendar | curated | `calendar agenda` exposes compact upcoming-event context. |
| im | curated | `im search` and guarded `im send`. |
| docs | curated | `docs fetch` and guarded `docs create`. |
| drive | pass-through curated read | `drive search` delegates through generic read handling. |
| base | pass-through curated read | `base records` delegates through generic read handling. |
| sheets | pass-through curated read | `sheets info` delegates through generic read handling. |
| task | pass-through curated read | `task list` delegates to `task +get-my-tasks`. |
| raw | fallback | `raw <lark-cli args...>` covers unsupported commands. |

Future work should generate this table from `lark-cli --help`, domain help, and schema metadata.
