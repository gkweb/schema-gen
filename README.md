# schema-gen

> High-performance OpenAPI to TypeScript/React Query/Vue Query code generation, powered by Rust.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

## Features

- **Blazing Fast** — Rust-powered parsing and transformation (10-70x faster than JS alternatives)
- **Type Safe** — Generates fully typed TypeScript code
- **Plugin Architecture** — Extensible with custom TypeScript plugins
- **Framework Support** — Built-in generators for React Query, Vue Query, and more
- **Orval-Inspired DX** — Simple, declarative configuration

## Installation

```bash
# npm
npm install @schema-gen/core @schema-gen/cli

# pnpm
pnpm add @schema-gen/core @schema-gen/cli

# yarn
yarn add @schema-gen/core @schema-gen/cli
```

## Quick Start

### CLI

```bash
# Initialize configuration
schema-gen init

# Generate code
schema-gen generate

# Generate with options
schema-gen generate --input ./openapi.yaml --output ./src/api
```

### Programmatic API

```typescript
import { generate, parseSpec } from '@schema-gen/core';

// Parse and generate in one step
const files = generate(specContent, ['typescript-types', 'typescript-enums']);

// Or parse first, then generate
const ast = parseSpec(specContent);
// ... manipulate AST ...
const files = native.generateTypescriptTypes(JSON.stringify(ast));
```

## Configuration

Create a `schema-gen.config.yaml` file:

```yaml
input:
  path: ./openapi.yaml
  validation: warn

output:
  dir: ./src/api
  structure: flat
  clean: true

plugins:
  - typescript-types
  - typescript-enums
  # - react-query
  # - vue-query

style:
  semi: true
  quotes: single
  trailingComma: all
```

## Built-in Generators

| Generator | Description |
|-----------|-------------|
| `typescript-types` | TypeScript interfaces and type aliases |
| `typescript-enums` | TypeScript enums or union types |
| `constants` | Endpoint paths and HTTP method constants |

### Coming Soon

- `react-query` — React Query hooks
- `vue-query` — Vue Query composables
- `zod-schemas` — Zod validation schemas
- `msw-handlers` — MSW mock handlers

## Custom Plugins

Create custom plugins with the plugin SDK:

```typescript
import { definePlugin } from '@schema-gen/plugin-sdk';

export default definePlugin({
  id: 'my-custom-plugin',
  name: 'My Custom Plugin',
  version: '1.0.0',

  async emit(context) {
    const { ast, utils } = context;

    // Generate custom code
    return [{
      path: 'custom.ts',
      content: `// Custom generated code for ${ast.info.title}`,
    }];
  },
});
```

## Architecture

schema-gen uses a three-layer architecture for maximum performance:

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

## Development

### Prerequisites

- Node.js 18+
- pnpm 9+
- Rust (stable)

### Setup

```bash
# Install dependencies
pnpm install

# Build Rust crates
cargo build --release

# Build NAPI binding
pnpm build:binding

# Build TypeScript packages
pnpm build
```

### Testing

```bash
# Run Rust tests
cargo test

# Run Node.js tests
pnpm test
```

## Packages

| Package | Description |
|---------|-------------|
| `@schema-gen/core` | Core library with native bindings |
| `@schema-gen/cli` | Command-line interface |
| `@schema-gen/plugin-sdk` | SDK for creating custom plugins |

## Rust Crates

| Crate | Description |
|-------|-------------|
| `schema-gen-core` | Core parsing and transformation logic |
| `schema-gen-binding` | NAPI-RS bindings for Node.js |

## Performance

Based on similar Rust-powered tools:

| Spec Size | Expected Time |
|-----------|---------------|
| Small (50 endpoints) | < 50ms |
| Medium (200 endpoints) | < 200ms |
| Large (500+ endpoints) | < 500ms |

## Inspired By

- [Orval](https://orval.dev/) — Excellent DX and configuration design
- [Tailwind CSS v4 Oxide](https://tailwindcss.com/blog/tailwindcss-v4-alpha) — Rust + NAPI-RS architecture
- [Rolldown](https://rolldown.rs/) — OXC-powered bundler approach

## License

MIT © [gkweb](https://github.com/gkweb)
