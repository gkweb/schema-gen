# @schema-gen/core

## 0.2.0

### Minor Changes

- [`b620d90`](https://github.com/gkweb/schema-gen/commit/b620d908342fe49423dd377af0e8cb6b39d85bd9) Thanks [@gkweb](https://github.com/gkweb)! - Initial public release: automated publishing via Changesets and napi-rs cross-platform native bindings.

- [#7](https://github.com/gkweb/schema-gen/pull/7) [`c83b064`](https://github.com/gkweb/schema-gen/commit/c83b0642f8e79c749a9c16fc5939a5e684471ecf) Thanks [@gkweb](https://github.com/gkweb)! - feat: expose vendor extensions (`x-*`) on AST nodes

  The Rust AST now preserves `x-*` extensions from the source spec on
  `SchemaAst`, `TypeNode`, `PropertyNode`, `EnumNode`, `EndpointNode`,
  `ParameterNode`, `RequestBodyNode`, and `ResponseNode` as an `extensions`
  field. Plugins can read these through the existing TypeScript types
  (re-exported via `@schema-gen/plugin-sdk` as `Extensions`).

  This is a purely additive change. Specs without extensions produce the
  same AST as before.

- [#7](https://github.com/gkweb/schema-gen/pull/7) [`d1d5772`](https://github.com/gkweb/schema-gen/commit/d1d57724a9bb18ece286999f317741a7e23825e7) Thanks [@gkweb](https://github.com/gkweb)! - feat: implement `output.structure: 'by-tag' | 'by-endpoint'`

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

- [#7](https://github.com/gkweb/schema-gen/pull/7) [`9d344b9`](https://github.com/gkweb/schema-gen/commit/9d344b9c3cfc85779a28cac67af18b19741c7843) Thanks [@gkweb](https://github.com/gkweb)! - feat: pre-parse spec transformer hook

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
