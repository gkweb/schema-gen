# What is schema-gen?

schema-gen is a high-performance OpenAPI to TypeScript code generator, powered by Rust.

## Why schema-gen?

Existing code generators like [Orval](https://orval.dev/) and [openapi-generator](https://openapi-generator.tech/) are powerful but can be slow when dealing with large OpenAPI specifications. schema-gen addresses this by using Rust for the heavy lifting:

- **10-70x faster** than JavaScript-based alternatives
- **Fully typed** TypeScript output with interfaces, enums, and type-safe API clients
- **Plugin architecture** for extensibility
- **Framework support** for React Query, Vue Query, and more

## Architecture

schema-gen uses a three-layer architecture:

```
┌─────────────────────────────────────────────────────────┐
│  Layer 1: JavaScript API (@schema-gen/core)             │
│  - User-facing npm package                              │
│  - Config loading, plugin orchestration                 │
├─────────────────────────────────────────────────────────┤
│  Layer 2: NAPI-RS Binding                               │
│  - FFI bridge between JS and Rust                       │
│  - Platform-specific native binaries                    │
├─────────────────────────────────────────────────────────┤
│  Layer 3: Rust Core (schema-gen-core)                   │
│  - OpenAPI parsing (openapiv3 crate)                    │
│  - AST generation and transformation                    │
│  - Built-in code generators                             │
└─────────────────────────────────────────────────────────┘
```

## Key Features

### Built-in Plugins

| Plugin | Description |
|--------|-------------|
| `typescript-types` | TypeScript interfaces and type aliases |
| `typescript-enums` | TypeScript enums or union types |
| `constants` | Endpoint paths and HTTP method constants |
| `request-paths` | Typed path builder functions |

### Official Plugins

| Plugin | Description |
|--------|-------------|
| `@schema-gen/plugin-react-query-v5` | TanStack React Query v5 hooks |
| `@schema-gen/plugin-vue-query-v4` | TanStack Vue Query v4 composables |

## Performance

Based on benchmarks with various specification sizes:

| Spec Size | Expected Time |
|-----------|---------------|
| Small (50 endpoints) | < 50ms |
| Medium (200 endpoints) | < 200ms |
| Large (500+ endpoints) | < 500ms |

## Next Steps

- [Installation](/guide/installation) - Get schema-gen installed
- [Quick Start](/guide/quick-start) - Generate your first code
- [Configuration](/guide/configuration) - Learn about configuration options
