# @schema-gen/plugin-vue-query-v4

## 0.2.1

### Patch Changes

- [`de8e069`](https://github.com/gkweb/schema-gen/commit/de8e069f02e7f9bdf01d7b4365e708a694c48e29) Thanks [@gkweb](https://github.com/gkweb)! - docs: publish per-package READMEs

- Updated dependencies [[`de8e069`](https://github.com/gkweb/schema-gen/commit/de8e069f02e7f9bdf01d7b4365e708a694c48e29)]:
  - @schema-gen/plugin-sdk@0.2.1

## 0.2.0

### Minor Changes

- [`b620d90`](https://github.com/gkweb/schema-gen/commit/b620d908342fe49423dd377af0e8cb6b39d85bd9) Thanks [@gkweb](https://github.com/gkweb)! - Initial public release: automated publishing via Changesets and napi-rs cross-platform native bindings.

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

- [#7](https://github.com/gkweb/schema-gen/pull/7) [`d1d5772`](https://github.com/gkweb/schema-gen/commit/d1d57724a9bb18ece286999f317741a7e23825e7) Thanks [@gkweb](https://github.com/gkweb)! - feat: per-operation `fetchFn`, `queryOptions`, `mutationOptions` overrides

  Three new fields on `OperationOverride` for the React Query v5 and
  Vue Query v4 plugins, plus matching plugin-level defaults:

  - `fetchFn?: { from; name } | false` — swap the HTTP function for a
    specific operation. `false` forces native `fetch` even if a global
    `fetchFn` is configured. Equivalent to per-op `output.override.mutator`
    in orval.
  - `queryOptions?: { from; name }` — wrap every emitted `useQuery`
    options object through `${name}(options, opContext)` before passing
    it to React Query / Vue Query, where
    `opContext = { operationId, method, path }`. Equivalent to orval's
    `output.override.query.queryOptions`.
  - `mutationOptions?: { from; name }` — same shape, applied to
    `useMutation`. Equivalent to orval's
    `output.override.query.mutationOptions`.

  Plugin-level `queryOptions` / `mutationOptions` on
  `ReactQueryV5Config` / `VueQueryV4Config` set the default for every
  operation; per-op overrides win for that specific operation.

  The opContext value is generated alongside the wrapper call, so user
  code can branch on operation identity without extra plumbing — useful
  for per-op headers, retry policy, or staleTime defaults.

### Patch Changes

- Updated dependencies [[`b620d90`](https://github.com/gkweb/schema-gen/commit/b620d908342fe49423dd377af0e8cb6b39d85bd9), [`c83b064`](https://github.com/gkweb/schema-gen/commit/c83b0642f8e79c749a9c16fc5939a5e684471ecf), [`d1d5772`](https://github.com/gkweb/schema-gen/commit/d1d57724a9bb18ece286999f317741a7e23825e7), [`9d344b9`](https://github.com/gkweb/schema-gen/commit/9d344b9c3cfc85779a28cac67af18b19741c7843)]:
  - @schema-gen/plugin-sdk@0.2.0
