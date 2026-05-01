---
'@schema-gen/core': minor
'@schema-gen/plugin-sdk': minor
'@schema-gen/cli': patch
---

feat: expose vendor extensions (`x-*`) on AST nodes

The Rust AST now preserves `x-*` extensions from the source spec on
`SchemaAst`, `TypeNode`, `PropertyNode`, `EnumNode`, `EndpointNode`,
`ParameterNode`, `RequestBodyNode`, and `ResponseNode` as an `extensions`
field. Plugins can read these through the existing TypeScript types
(re-exported via `@schema-gen/plugin-sdk` as `Extensions`).

This is a purely additive change. Specs without extensions produce the
same AST as before.
