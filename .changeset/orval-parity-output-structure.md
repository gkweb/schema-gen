---
'@schema-gen/core': minor
'@schema-gen/plugin-sdk': minor
'@schema-gen/plugin-react-query-v5': minor
'@schema-gen/plugin-vue-query-v4': minor
---

feat: implement `output.structure: 'by-tag' | 'by-endpoint'`

The `output.structure` config option was previously accepted but
ignored by the built-in query plugins. It is now wired through to
`PluginContext.outputStructure` and honored by both the React Query v5
and Vue Query v4 plugins:

- `flat` (default) — single file (existing behavior).
- `by-tag` — one file per first-tag, kebab-cased; untagged endpoints
  collapse into `default.ts`.
- `by-endpoint` — one file per generated operation, kebab-cased
  operationId.

Equivalent to orval's `output.mode: 'tags-split' | 'split'`. Custom
plugins can read `ctx.outputStructure` and mirror the same grouping.
