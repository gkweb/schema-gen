---
'@schema-gen/plugin-react-query-v5': minor
'@schema-gen/plugin-vue-query-v4': minor
---

feat: per-operation `fetchFn`, `queryOptions`, `mutationOptions` overrides

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
