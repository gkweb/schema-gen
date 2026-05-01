---
'@schema-gen/core': minor
'@schema-gen/plugin-sdk': minor
'@schema-gen/cli': patch
---

feat: pre-parse spec transformer hook

Two new ways to mutate the OpenAPI document before schema-gen builds
the AST:

- `input.transformer` on `UserConfig` accepts either a function
  `(spec) => spec` or a path to a module that default-exports such a
  function (loaded via jiti, so TypeScript transformers work without
  a separate compile step).
- `Plugin.onSpec(rawSpec, ctx)` lifecycle hook fires after
  `input.transformer` and before any AST processing, so plugins can
  apply their own pre-parse mutations.

Equivalent to orval's `input.override.transformer`. Two new helpers,
`parseRawSpec` and `transformSpec`, are exposed for advanced callers
that want to drive this pipeline themselves.
