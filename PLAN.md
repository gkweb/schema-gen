# Schema-Gen: Rust-Powered OpenAPI Code Generation

> A high-performance, plugin-based code generation engine for transforming OpenAPI v3 specifications into TypeScript types, React Query hooks, Vue Query composables, and more.

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Motivation](#motivation)
3. [Architecture Overview](#architecture-overview)
4. [Runtime Architecture: The Oxide Pattern](#runtime-architecture-the-oxide-pattern)
5. [Core AST Schema Design](#core-ast-schema-design)
6. [Plugin System](#plugin-system)
7. [Configuration API](#configuration-api)
8. [Implementation Phases](#implementation-phases)
9. [Performance Targets](#performance-targets)
10. [Testing Strategy](#testing-strategy)
11. [Open Questions](#open-questions)

---

## Executive Summary

Schema-Gen is a strategic rebuild of OpenAPI code generation tooling, taking inspiration from [Orval](https://orval.dev/)'s excellent developer experience while addressing performance and extensibility limitations inherent in JavaScript/Node-based implementations.

### Key Principles

1. **Rust as the core engine** — Parsing, schema traversal, and AST generation in Rust for maximum performance
2. **Language-agnostic core transformer** — Input: OpenAPI v3, Output: strongly-typed AST representation
3. **Plugin pipeline architecture** — Translate core AST → language targets (TypeScript types, React Query, Vue Query, etc.)
4. **Interoperability** — Leverage existing Rust OpenAPI libraries for performance and correctness

### What This Enables

- Blazing fast CLI performance, especially for large specs (500+ endpoints)
- Deterministic, reproducible output
- Parallelized transforms where safe
- Deep customization without modifying core

---

## Motivation

### Current Limitations (Orval and similar tools)

| Challenge | Impact |
|-----------|--------|
| JavaScript/Node performance | Slow generation for large or complex specs |
| Monolithic generation | "Generate everything at once" limits incremental workflows |
| Extensibility friction | Adding new client flavors requires deep modifications |
| No true core transformer | Tightly coupled parsing → output makes plugins difficult |

### Goals

- **Preserve Orval's DX** — Simple, declarative, powerful configuration
- **10x+ performance improvement** — Handle large specs in seconds
- **Plugin-first architecture** — Core knows nothing about output formats
- **Type safety throughout** — Strongly typed AST prevents malformed output

---

## Architecture Overview

### High-Level Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              SCHEMA-GEN PIPELINE                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────┐    ┌──────────────────┐    ┌────────────────────────┐    │
│  │   OpenAPI    │    │  Core Transformer │    │   Plugin Execution     │    │
│  │   Spec       │───▶│  (Rust)           │───▶│   (Phase 2)            │    │
│  │  JSON/YAML   │    │                   │    │                        │    │
│  └──────────────┘    │  • Parse spec     │    │  • TypeScript Types    │    │
│                      │  • Validate       │    │  • Enums               │    │
│                      │  • Normalize      │    │  • Constants           │    │
│                      │  • Build AST      │    │  • React Query         │    │
│                      └──────────────────┘    │  • Vue Query           │    │
│                              │               │  • Custom Fetch        │    │
│                              ▼               └────────────────────────┘    │
│                      ┌──────────────────┐              │                   │
│                      │   Core AST       │              │                   │
│                      │   (Typed IR)     │──────────────┘                   │
│                      └──────────────────┘              │                   │
│                                                        ▼                   │
│                                               ┌────────────────────┐       │
│                                               │  Generated Files   │       │
│                                               │  • .ts / .tsx      │       │
│                                               │  • .vue            │       │
│                                               │  • index files     │       │
│                                               └────────────────────┘       │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Core Flow (Detailed)

#### Phase 1: Load & Parse
- Read OpenAPI spec (JSON or YAML)
- Deserialize into internal representation
- Validate against OpenAPI v3 specification
- Handle `$ref` resolution (internal and external references)

#### Phase 2: Core Transformer
- Traverse entire schema
- Create AST nodes for:
  - **Types** — Request/response bodies, parameters
  - **Enums** — String/integer enums from schema
  - **Constants** — Endpoint paths, HTTP methods, status codes
  - **Endpoints** — Full operation definitions with metadata
  - **Query Strategies** — GET vs mutation classification

#### Phase 3: Plugin Execution
- Plugins register for specific AST node types
- Plugins receive nodes and emit code artifacts
- Execution order is deterministic and configurable

#### Phase 4: Emit Artifacts
- Write generated source files
- Create barrel exports (index.ts)
- Optionally format output (prettier integration)

---

## Runtime Architecture: The Oxide Pattern

Based on research into how modern JavaScript tooling integrates Rust for performance, we've identified a clear community standard pattern used by Tailwind v4 (Oxide), Rolldown/Vite, Rspack, SWC, Lightning CSS, and Biome.

### Industry Analysis

| Project | Rust Integration | Binding Layer | Key Insight |
|---------|------------------|---------------|-------------|
| [Tailwind v4 Oxide](https://tailwindcss.com/blog/tailwindcss-v4-alpha) | Core scanning in Rust | NAPI-RS | 10x faster builds, migrated "expensive and parallelizable" parts |
| [Rolldown/Vite](https://rolldown.rs/) | Full bundler in Rust (OXC) | NAPI-RS | Unified dev/prod, 3-16x faster builds |
| [Rspack](https://rspack.rs/) | Core bundler in Rust | NAPI-RS | Three-layer architecture (JS API → Binding → Rust Core) |
| [SWC](https://swc.rs/) | Full compiler in Rust | NAPI-RS | 20x faster than Babel single-thread, 70x on 4 cores |
| [Lightning CSS](https://lightningcss.dev/) | Full CSS processor in Rust | NAPI-RS | 2.7M lines/sec single-thread, powers Tailwind v4 |
| [Biome](https://biomejs.dev/) | Linter + formatter in Rust | NAPI-RS | Prettier/ESLint alternative |

### The Standard Pattern: NAPI-RS

**[NAPI-RS](https://napi.rs/)** has emerged as the de-facto standard for Rust-Node.js bindings. It provides:

- **N-API stability** — Works across Node.js versions without recompilation
- **Automatic TypeScript generation** — `.d.ts` files generated from Rust code
- **Platform binary distribution** — Handles cross-compilation and npm packaging
- **WASM fallback** — Same code can compile to WebAssembly for browsers/Deno

### Three-Layer Architecture (Rspack Model)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            THREE-LAYER ARCHITECTURE                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                     LAYER 1: JavaScript API                         │   │
│  │  • User-facing npm package (@schema-gen/core)                       │   │
│  │  • TypeScript types and interfaces                                  │   │
│  │  • Config loading and validation                                    │   │
│  │  • Plugin orchestration (JS/TS plugins)                             │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                        │
│                                    ▼                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                     LAYER 2: Binding Layer                          │   │
│  │  • @schema-gen/binding (NAPI-RS generated)                          │   │
│  │  • FFI bridge between JS and Rust                                   │   │
│  │  • Serialization/deserialization (JSON ↔ Rust structs)              │   │
│  │  • Platform-specific binaries via optionalDependencies              │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                        │
│                                    ▼                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                     LAYER 3: Rust Core                              │   │
│  │  • OpenAPI parsing (openapiv3 crate)                                │   │
│  │  • AST generation and transformation                                │   │
│  │  • Built-in code generators (types, enums, constants)               │   │
│  │  • Parallelized processing                                          │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Platform Binary Distribution

Following the [Lightning CSS](https://github.com/parcel-bundler/lightningcss) and Tailwind Oxide pattern:

```
@schema-gen/
├── core/                           # Main package (JS wrapper)
│   ├── package.json
│   │   └── optionalDependencies:
│   │       ├── @schema-gen/binding-darwin-arm64
│   │       ├── @schema-gen/binding-darwin-x64
│   │       ├── @schema-gen/binding-linux-x64-gnu
│   │       ├── @schema-gen/binding-linux-x64-musl
│   │       ├── @schema-gen/binding-linux-arm64-gnu
│   │       ├── @schema-gen/binding-win32-x64-msvc
│   │       └── @schema-gen/binding-wasm32        # Browser/Deno fallback
│   └── index.js                    # Loads correct binary at runtime
└── binding-{platform}/             # Platform-specific packages
    ├── package.json
    │   ├── os: ["darwin" | "linux" | "win32"]
    │   └── cpu: ["arm64" | "x64"]
    └── schema-gen.{platform}.node  # Native binary
```

### Recommended Architecture for Schema-Gen

Based on industry patterns, we recommend:

#### What Runs in Rust (Performance-Critical)

| Component | Rationale |
|-----------|-----------|
| OpenAPI parsing | CPU-intensive, benefits from zero-copy parsing |
| `$ref` resolution | Graph traversal, benefits from Rust's ownership model |
| AST generation | Memory-intensive, Rust's allocator is faster |
| Type normalization | Complex logic (allOf/anyOf/oneOf), parallelizable |
| Built-in code generation | String building, parallelizable per-endpoint |

#### What Runs in Node.js (Flexibility-Critical)

| Component | Rationale |
|-----------|-----------|
| Config loading | JS ecosystem (cosmiconfig, etc.) |
| Custom plugins | Familiar to users, hot-reloadable |
| Template rendering | EJS/Handlebars ecosystem |
| File writing | Node.js fs is sufficient |
| Watch mode | chokidar ecosystem |

### Existing Rust OpenAPI Ecosystem

We can leverage existing, well-maintained crates:

| Crate | Downloads | Purpose |
|-------|-----------|---------|
| [`openapiv3`](https://docs.rs/openapiv3) | 5.3M+ | OpenAPI v3 spec deserialization |
| [`progenitor`](https://github.com/oxidecomputer/progenitor) | 1.7M+ | Oxide's OpenAPI client generator (reference) |
| [`utoipa`](https://github.com/juhaku/utoipa) | — | OpenAPI types in Rust (alternative approach) |

The `openapiv3` crate is the clear choice — it's the same one used by `progenitor` (Oxide Computer's generator) and provides complete OpenAPI v3.0/3.1 support with serde integration.

### Package Structure (Updated)

```
schema-gen/
├── Cargo.toml                      # Rust workspace
├── package.json                    # pnpm workspace
├── pnpm-workspace.yaml
│
├── crates/                         # Rust crates
│   ├── schema-gen-core/            # Core library (pure Rust)
│   │   ├── Cargo.toml
│   │   └── src/
│   │       ├── lib.rs
│   │       ├── parser/             # OpenAPI parsing (openapiv3)
│   │       ├── ast/                # AST definitions
│   │       ├── transform/          # OAS → AST
│   │       └── codegen/            # Built-in generators
│   │
│   └── schema-gen-binding/         # NAPI-RS binding layer
│       ├── Cargo.toml
│       │   └── [dependencies]
│       │       └── napi = { version = "2", features = ["serde-json"] }
│       │       └── napi-derive = "2"
│       ├── build.rs                # napi build script
│       └── src/
│           └── lib.rs              # #[napi] exports
│
├── packages/                       # Node.js packages
│   ├── core/                       # @schema-gen/core
│   │   ├── package.json
│   │   │   └── optionalDependencies: { platform binaries }
│   │   ├── src/
│   │   │   ├── index.ts            # Main API
│   │   │   ├── binding.ts          # Native loader
│   │   │   ├── config.ts           # Config loading
│   │   │   └── plugins/            # Plugin runtime
│   │   └── index.d.ts              # Generated from Rust
│   │
│   ├── cli/                        # @schema-gen/cli
│   │   ├── package.json
│   │   └── src/
│   │       └── bin.ts
│   │
│   └── plugin-sdk/                 # @schema-gen/plugin-sdk
│       ├── package.json
│       └── src/
│           ├── index.ts
│           └── types.ts
│
├── binding-*/                      # Generated platform packages
│   └── (created by napi build)
│
└── plugins/                        # Example/official plugins
    ├── react-query/
    ├── vue-query/
    └── zod-schemas/
```

### NAPI-RS Configuration

```json
// packages/core/package.json
{
  "name": "@schema-gen/core",
  "version": "0.1.0",
  "napi": {
    "name": "schema-gen",
    "triples": {
      "defaults": true,
      "additional": [
        "aarch64-apple-darwin",
        "aarch64-unknown-linux-gnu",
        "aarch64-unknown-linux-musl",
        "x86_64-unknown-linux-musl",
        "aarch64-pc-windows-msvc"
      ]
    }
  },
  "optionalDependencies": {
    "@schema-gen/binding-darwin-arm64": "0.1.0",
    "@schema-gen/binding-darwin-x64": "0.1.0",
    "@schema-gen/binding-linux-arm64-gnu": "0.1.0",
    "@schema-gen/binding-linux-arm64-musl": "0.1.0",
    "@schema-gen/binding-linux-x64-gnu": "0.1.0",
    "@schema-gen/binding-linux-x64-musl": "0.1.0",
    "@schema-gen/binding-win32-arm64-msvc": "0.1.0",
    "@schema-gen/binding-win32-x64-msvc": "0.1.0"
  }
}
```

### Rust Binding Example

```rust
// crates/schema-gen-binding/src/lib.rs
use napi::bindgen_prelude::*;
use napi_derive::napi;
use schema_gen_core::{parse_openapi, transform_to_ast, generate_code};

/// Parse an OpenAPI spec and return the AST as JSON
#[napi]
pub fn parse_spec(spec_content: String, format: String) -> Result<String> {
    let spec = parse_openapi(&spec_content, &format)
        .map_err(|e| Error::from_reason(e.to_string()))?;

    let ast = transform_to_ast(spec)
        .map_err(|e| Error::from_reason(e.to_string()))?;

    serde_json::to_string(&ast)
        .map_err(|e| Error::from_reason(e.to_string()))
}

/// Generate code for a specific plugin
#[napi]
pub fn generate(ast_json: String, plugin: String, config_json: String) -> Result<Vec<GeneratedFile>> {
    let ast: SchemaAST = serde_json::from_str(&ast_json)
        .map_err(|e| Error::from_reason(e.to_string()))?;

    let config: PluginConfig = serde_json::from_str(&config_json)
        .map_err(|e| Error::from_reason(e.to_string()))?;

    generate_code(&ast, &plugin, &config)
        .map_err(|e| Error::from_reason(e.to_string()))
}

#[napi(object)]
pub struct GeneratedFile {
    pub path: String,
    pub content: String,
}
```

### Performance Expectations

Based on benchmarks from similar tools:

| Tool | Before (JS) | After (Rust/NAPI) | Speedup |
|------|-------------|-------------------|---------|
| Tailwind CSS | 960ms | 105ms | ~10x |
| SWC vs Babel | — | — | 20-70x |
| Rolldown vs Rollup | 22.9s | 1.4s | ~16x |
| Lightning CSS | — | 2.7M lines/sec | — |

**Expected for Schema-Gen:**
- Small specs: < 50ms (vs ~500ms typical JS tools)
- Large specs (500+ endpoints): < 500ms (vs 5-10s typical)
- Memory: 50-100MB peak (vs 500MB+ typical)

### Decision: Hybrid Plugin Architecture

Given the research, we recommend:

1. **Built-in plugins in Rust** — TypeScript types, enums, constants (fastest path)
2. **Custom plugins in TypeScript** — Via Node.js plugin runtime (most flexible)
3. **WASM fallback** — For browser-based playgrounds or Deno

This matches the Tailwind v4 approach: "migrated the most expensive and parallelizable parts to Rust, while keeping the core framework in TypeScript for extensibility."

### References

- [NAPI-RS Documentation](https://napi.rs/)
- [Tailwind CSS v4 Alpha Announcement](https://tailwindcss.com/blog/tailwindcss-v4-alpha)
- [Rolldown GitHub](https://github.com/rolldown/rolldown)
- [Rspack Architecture](https://rspack.rs/)
- [Lightning CSS GitHub](https://github.com/parcel-bundler/lightningcss)
- [OXC Project](https://github.com/oxc-project/oxc)
- [Progenitor (Oxide OpenAPI Generator)](https://github.com/oxidecomputer/progenitor)

---

## Core AST Schema Design

The AST is the contract between the core transformer and plugins. It must be:
- **Complete** — Capture all information needed for any reasonable output
- **Normalized** — No ambiguity, no spec-specific quirks
- **Serializable** — JSON/Protobuf for debugging and plugin interop

### Proposed AST Node Types

```rust
// Root container
pub struct SchemaAST {
    pub info: ApiInfo,
    pub types: Vec<TypeNode>,
    pub enums: Vec<EnumNode>,
    pub endpoints: Vec<EndpointNode>,
    pub constants: Vec<ConstantNode>,
    pub tags: Vec<TagNode>,
}

// API metadata
pub struct ApiInfo {
    pub title: String,
    pub version: String,
    pub description: Option<String>,
    pub base_url: Option<String>,
    pub servers: Vec<ServerInfo>,
}

// Type definitions (schemas)
pub struct TypeNode {
    pub id: String,                    // Unique identifier
    pub name: String,                  // PascalCase name
    pub original_name: String,         // Name from spec
    pub description: Option<String>,
    pub kind: TypeKind,
    pub properties: Vec<PropertyNode>,
    pub required: Vec<String>,
    pub nullable: bool,
    pub deprecated: bool,
    pub source_path: String,           // JSON pointer in original spec
}

pub enum TypeKind {
    Object,
    Array { items: Box<TypeRef> },
    Union { variants: Vec<TypeRef> },
    Intersection { parts: Vec<TypeRef> },
    Primitive(PrimitiveType),
    Reference(String),                  // Reference to another TypeNode
}

pub enum PrimitiveType {
    String { format: Option<StringFormat> },
    Number { format: Option<NumberFormat> },
    Integer { format: Option<IntegerFormat> },
    Boolean,
    Null,
    Any,
}

// Property within a type
pub struct PropertyNode {
    pub name: String,
    pub original_name: String,
    pub description: Option<String>,
    pub type_ref: TypeRef,
    pub required: bool,
    pub nullable: bool,
    pub readonly: bool,
    pub deprecated: bool,
    pub default: Option<serde_json::Value>,
}

// Reference to a type (inline or named)
pub enum TypeRef {
    Named(String),                      // Reference to TypeNode by id
    Inline(Box<TypeNode>),              // Anonymous inline type
    Array(Box<TypeRef>),
    Primitive(PrimitiveType),
}

// Enum definitions
pub struct EnumNode {
    pub id: String,
    pub name: String,
    pub original_name: String,
    pub description: Option<String>,
    pub variants: Vec<EnumVariant>,
    pub value_type: EnumValueType,
    pub source_path: String,
}

pub struct EnumVariant {
    pub name: String,                   // SCREAMING_SNAKE_CASE
    pub value: EnumValue,
    pub description: Option<String>,
}

pub enum EnumValueType {
    String,
    Integer,
}

pub enum EnumValue {
    String(String),
    Integer(i64),
}

// Endpoint (operation) definitions
pub struct EndpointNode {
    pub id: String,                     // Unique operation identifier
    pub operation_id: Option<String>,   // From spec
    pub method: HttpMethod,
    pub path: String,
    pub summary: Option<String>,
    pub description: Option<String>,
    pub tags: Vec<String>,
    pub parameters: Vec<ParameterNode>,
    pub request_body: Option<RequestBodyNode>,
    pub responses: Vec<ResponseNode>,
    pub security: Vec<SecurityRequirement>,
    pub deprecated: bool,
    pub query_type: QueryType,          // Derived: query vs mutation
}

pub enum HttpMethod {
    Get,
    Post,
    Put,
    Patch,
    Delete,
    Head,
    Options,
}

pub enum QueryType {
    Query,      // GET, HEAD, OPTIONS — cacheable
    Mutation,   // POST, PUT, PATCH, DELETE — side effects
}

pub struct ParameterNode {
    pub name: String,
    pub location: ParameterLocation,
    pub description: Option<String>,
    pub type_ref: TypeRef,
    pub required: bool,
    pub deprecated: bool,
    pub style: Option<ParameterStyle>,
    pub explode: bool,
}

pub enum ParameterLocation {
    Path,
    Query,
    Header,
    Cookie,
}

pub struct RequestBodyNode {
    pub description: Option<String>,
    pub required: bool,
    pub content: Vec<MediaTypeContent>,
}

pub struct ResponseNode {
    pub status_code: StatusCode,
    pub description: Option<String>,
    pub content: Vec<MediaTypeContent>,
    pub headers: Vec<HeaderNode>,
}

pub enum StatusCode {
    Code(u16),
    Default,
    Range1xx,
    Range2xx,
    Range3xx,
    Range4xx,
    Range5xx,
}

pub struct MediaTypeContent {
    pub media_type: String,             // e.g., "application/json"
    pub type_ref: Option<TypeRef>,
}

// Constants for codegen
pub struct ConstantNode {
    pub id: String,
    pub name: String,
    pub kind: ConstantKind,
    pub value: serde_json::Value,
}

pub enum ConstantKind {
    EndpointPath,
    HttpMethod,
    StatusCode,
    MediaType,
    Custom,
}

// Tag grouping
pub struct TagNode {
    pub name: String,
    pub description: Option<String>,
    pub endpoints: Vec<String>,         // Endpoint ids
}
```

### AST Design Principles

1. **No OpenAPI-specific quirks** — The AST normalizes discriminated unions, allOf/anyOf/oneOf, etc.
2. **Preserved metadata** — Original names, source paths, descriptions retained for tooling
3. **Derived classifications** — Query vs mutation type derived from HTTP method
4. **Unique identifiers** — Every node has a stable ID for plugin reference

---

## Plugin System

### Architecture Goals

- Core is strictly **OAS → AST** transformation
- Plugins handle **AST → Output** transformation
- Plugin authors can deeply customize without forking core

### Plugin Interface

```typescript
// TypeScript interface (for TS-based plugins)
interface TransformerPlugin {
  /** Unique plugin identifier */
  id: string;

  /** Plugin display name */
  name: string;

  /** Plugin version */
  version: string;

  /** Dependencies on other plugins (for ordering) */
  dependencies?: string[];

  /** Called once before processing begins */
  onStart?(context: PluginContext): void | Promise<void>;

  /** Called for each type node */
  onType?(node: TypeNode, context: PluginContext): TypeNode | void;

  /** Called for each enum node */
  onEnum?(node: EnumNode, context: PluginContext): EnumNode | void;

  /** Called for each endpoint node */
  onEndpoint?(node: EndpointNode, context: PluginContext): EndpointNode | void;

  /** Called for each constant node */
  onConstant?(node: ConstantNode, context: PluginContext): ConstantNode | void;

  /** Called once after all nodes processed, to emit files */
  emit?(context: PluginContext): GeneratedFile[] | Promise<GeneratedFile[]>;

  /** Called once after all plugins have emitted */
  onEnd?(context: PluginContext): void | Promise<void>;
}

interface PluginContext {
  /** Full AST for reference */
  ast: SchemaAST;

  /** Plugin configuration from user config */
  config: Record<string, unknown>;

  /** Output directory */
  outputDir: string;

  /** Logger */
  log: Logger;

  /** Access to other plugins' shared state */
  shared: Map<string, unknown>;

  /** Helper utilities */
  utils: PluginUtils;
}

interface GeneratedFile {
  /** Relative path from output directory */
  path: string;

  /** File contents */
  content: string;

  /** Optional: skip formatting */
  skipFormat?: boolean;
}

interface PluginUtils {
  /** Convert string to PascalCase */
  toPascalCase(s: string): string;

  /** Convert string to camelCase */
  toCamelCase(s: string): string;

  /** Convert string to SCREAMING_SNAKE_CASE */
  toScreamingSnakeCase(s: string): string;

  /** Resolve a TypeRef to its full type */
  resolveType(ref: TypeRef): TypeNode;

  /** Get all endpoints for a tag */
  getEndpointsByTag(tag: string): EndpointNode[];

  /** Render a template */
  renderTemplate(template: string, data: unknown): string;
}
```

### Plugin Capabilities

Plugins can:
- **Read** AST nodes at different phases
- **Mutate** nodes (with new node returned)
- **Emit** code artifacts
- **Share state** with other plugins via context
- **Depend on** other plugins for ordering

### Built-in Plugins (Phase 2)

| Plugin | Description | Output |
|--------|-------------|--------|
| `typescript-types` | Generate TypeScript interfaces/types | `types.ts`, `types/*.ts` |
| `typescript-enums` | Generate TypeScript enums or union types | `enums.ts` |
| `constants` | Generate endpoint path constants | `constants.ts` |
| `react-query` | Generate React Query hooks | `hooks/*.ts` |
| `vue-query` | Generate Vue Query composables | `composables/*.ts` |
| `fetch-client` | Generate typed fetch client | `client.ts` |
| `axios-client` | Generate typed Axios client | `client.ts` |
| `zod-schemas` | Generate Zod validation schemas | `schemas.ts` |
| `msw-handlers` | Generate MSW mock handlers | `mocks/*.ts` |

---

## Configuration API

### Design Goals

- Orval-style DX: simple, declarative, powerful
- Single config file (YAML or JSON)
- Override capability at multiple levels

### Config Schema

```yaml
# schema-gen.config.yaml

# Input specification
input:
  # Path to OpenAPI spec (local file or URL)
  path: ./openapi.yaml
  # Optional: specific version/tag for remote specs
  version: v1
  # Optional: validation strictness
  validation: strict | warn | off

# Output configuration
output:
  # Output directory
  dir: ./src/api
  # File organization strategy
  structure: flat | by-tag | by-endpoint
  # Clean output directory before generation
  clean: true

# Plugin configuration
plugins:
  # Enable built-in plugins by name
  - typescript-types
  - typescript-enums
  - react-query

  # Plugin with configuration
  - name: fetch-client
    config:
      baseUrl: /api
      credentials: include

  # Custom plugin from file
  - name: custom-transform
    path: ./plugins/custom-transform.ts
    config:
      option1: value1

# Global transforms (apply to all applicable plugins)
transform:
  # Naming conventions
  naming:
    types: PascalCase        # PascalCase | camelCase | preserve
    properties: camelCase    # PascalCase | camelCase | snake_case | preserve
    enums: SCREAMING_SNAKE   # PascalCase | SCREAMING_SNAKE | preserve

  # Type mappings
  typeOverrides:
    # Map OpenAPI formats to custom types
    "string:date-time": Date
    "string:uuid": string
    "integer:int64": bigint

  # Filter endpoints
  include:
    tags: [users, products]   # Only these tags
    paths: ["/api/v1/*"]      # Glob patterns
  exclude:
    tags: [internal, admin]
    operationIds: [deprecated*]

# Fetch strategy configuration
fetch:
  # Default fetch implementation
  default: fetch | axios | ky | custom

  # Custom implementation
  custom:
    import: "@/lib/http"
    function: customFetch

  # Per-endpoint overrides
  overrides:
    "GET /users": axios
    "POST /upload": custom

# React Query specific options
reactQuery:
  # Query key factory style
  queryKeys: array | object
  # Suspense support
  suspense: false
  # Infinite query detection
  infiniteQueries:
    detectByParam: [page, cursor, offset]
  # Mutation hooks
  mutations:
    invalidateOnSuccess: true

# Vue Query specific options
vueQuery:
  # Composition API style
  compositionApi: true
  # Use defineComponent wrapper
  defineComponent: false

# Code style
style:
  # Semicolons
  semi: true
  # Quote style
  quotes: single | double
  # Trailing commas
  trailingComma: all | es5 | none
  # Tab width
  tabWidth: 2
  # Use tabs
  useTabs: false
  # Print width (line length)
  printWidth: 80
```

### CLI Interface

```bash
# Generate with default config
schema-gen generate

# Generate with specific config file
schema-gen generate --config ./config/schema-gen.yaml

# Generate with CLI overrides
schema-gen generate --input ./spec.yaml --output ./src/api

# Output AST only (for debugging)
schema-gen ast ./spec.yaml --format json
schema-gen ast ./spec.yaml --format yaml

# Validate spec without generating
schema-gen validate ./spec.yaml

# List available plugins
schema-gen plugins list

# Plugin info
schema-gen plugins info react-query

# Initialize config file
schema-gen init

# Watch mode
schema-gen generate --watch
```

---

## Implementation Phases

### Phase 1: Core Transformer (MVP)

**Objective:** Build the Rust core that parses OpenAPI v3 and produces a well-defined AST.

#### Deliverables

1. **OpenAPI Parser**
   - JSON and YAML support
   - OpenAPI v3.0 and v3.1 compatibility
   - `$ref` resolution (local and remote)
   - Validation against spec

2. **AST Generator**
   - Full AST schema implementation
   - Normalization of complex types (allOf, anyOf, oneOf)
   - Circular reference handling
   - Enum extraction from string literals

3. **CLI (Basic)**
   - `schema-gen ast <spec>` — Output AST as JSON
   - `schema-gen validate <spec>` — Validate spec
   - Basic error reporting with source locations

4. **Testing**
   - Unit tests for each AST node type
   - Integration tests with known OpenAPI specs
   - Property-based tests for edge cases

5. **Benchmarks**
   - Performance benchmarks against large specs
   - Memory usage profiling
   - Comparison with existing tools

#### Technical Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| OpenAPI Parsing | `openapiv3` crate | Well-maintained, full v3 support |
| YAML Parsing | `serde_yaml` | Standard, integrates with serde |
| JSON Output | `serde_json` | Standard, pretty-print support |
| Error Handling | `miette` | Beautiful error messages with source spans |
| CLI Framework | `clap` | Industry standard, derive macros |
| Async Runtime | None (sync first) | Simplicity, async later if needed |

#### Directory Structure (Phase 1)

```
schema-gen/
├── Cargo.toml
├── Cargo.lock
├── README.md
├── PLAN.md
├── crates/
│   ├── schema-gen-core/          # Core library
│   │   ├── Cargo.toml
│   │   └── src/
│   │       ├── lib.rs
│   │       ├── parser/           # OpenAPI parsing
│   │       │   ├── mod.rs
│   │       │   ├── openapi.rs
│   │       │   └── refs.rs       # $ref resolution
│   │       ├── ast/              # AST definitions
│   │       │   ├── mod.rs
│   │       │   ├── types.rs
│   │       │   ├── enums.rs
│   │       │   ├── endpoints.rs
│   │       │   └── constants.rs
│   │       ├── transform/        # OAS → AST transformation
│   │       │   ├── mod.rs
│   │       │   ├── schemas.rs
│   │       │   ├── operations.rs
│   │       │   └── normalize.rs
│   │       └── error.rs          # Error types
│   └── schema-gen-cli/           # CLI binary
│       ├── Cargo.toml
│       └── src/
│           ├── main.rs
│           └── commands/
│               ├── mod.rs
│               ├── ast.rs
│               └── validate.rs
├── tests/
│   ├── fixtures/                 # Test OpenAPI specs
│   │   ├── petstore.yaml
│   │   ├── github.yaml
│   │   └── complex-refs.yaml
│   └── integration/
│       └── ast_generation.rs
└── benches/
    └── parsing.rs
```

#### Milestones

| Milestone | Description | Acceptance Criteria |
|-----------|-------------|---------------------|
| M1.1 | Basic parsing | Parse Petstore spec, output raw structure |
| M1.2 | AST schema | All AST types defined with serde support |
| M1.3 | Type extraction | Extract all schema types to TypeNode |
| M1.4 | Enum extraction | Extract enums, handle inline enums |
| M1.5 | Endpoint extraction | Full EndpointNode with params, body, responses |
| M1.6 | Reference resolution | Handle $ref including circular refs |
| M1.7 | CLI complete | `ast` and `validate` commands working |
| M1.8 | Test suite | 90%+ coverage, all fixtures passing |
| M1.9 | Benchmarks | Baseline established, targets met |

---

### Phase 2: Plugin System & Built-in Plugins

**Objective:** Implement the plugin architecture and build plugins that replicate Orval's core output.

#### Plugin Runtime Options

We have three options for plugin execution:

**Option A: Native Rust Plugins (Compile-time)**
- Plugins written in Rust, compiled into binary
- Fastest execution
- Requires recompilation for new plugins

**Option B: WASM Plugins (Runtime)**
- Plugins compiled to WASM
- Can be written in any WASM-compatible language
- Sandboxed, safe execution
- Good performance

**Option C: Node.js Plugin Host (Runtime)**
- Core outputs AST as JSON
- Node.js process runs plugins
- Plugins in TypeScript/JavaScript
- Most flexible, familiar to web developers
- Slight performance overhead

**Recommended: Hybrid Approach**
- Built-in plugins in Rust (compiled)
- Custom plugins via Node.js host or WASM
- Best of both worlds

#### Deliverables

1. **Plugin Runtime**
   - Plugin loading and initialization
   - Lifecycle hook execution
   - Context and utilities provision
   - Error handling and recovery

2. **TypeScript Types Plugin**
   - Interface generation
   - Type aliases
   - Utility types (Pick, Omit for partials)
   - JSDoc comments from descriptions

3. **Enum Plugin**
   - TypeScript enums or const objects
   - Union type alternatives
   - Runtime enum utilities

4. **Constants Plugin**
   - Endpoint path constants
   - HTTP method constants
   - Status code constants

5. **React Query Plugin**
   - `useQuery` hooks for GET endpoints
   - `useMutation` hooks for mutations
   - Query key factories
   - Infinite query support
   - Suspense variants

6. **Vue Query Plugin**
   - `useQuery` composables
   - `useMutation` composables
   - Query key factories

7. **Fetch Client Plugin**
   - Typed fetch wrapper
   - Request/response interceptors
   - Error handling

8. **Configuration System**
   - Config file parsing (YAML/JSON)
   - CLI argument merging
   - Validation with helpful errors

#### Directory Structure (Phase 2 additions)

```
schema-gen/
├── crates/
│   ├── schema-gen-core/
│   ├── schema-gen-cli/
│   ├── schema-gen-plugins/       # Plugin runtime
│   │   ├── Cargo.toml
│   │   └── src/
│   │       ├── lib.rs
│   │       ├── runtime.rs        # Plugin execution
│   │       ├── context.rs        # PluginContext
│   │       └── utils.rs          # PluginUtils
│   └── schema-gen-builtin/       # Built-in plugins
│       ├── Cargo.toml
│       └── src/
│           ├── lib.rs
│           ├── typescript_types.rs
│           ├── typescript_enums.rs
│           ├── constants.rs
│           ├── react_query.rs
│           ├── vue_query.rs
│           └── fetch_client.rs
├── packages/                      # Node.js packages
│   ├── plugin-sdk/               # TypeScript plugin SDK
│   │   ├── package.json
│   │   └── src/
│   │       ├── index.ts
│   │       └── types.ts
│   └── node-host/                # Node.js plugin host
│       ├── package.json
│       └── src/
│           └── index.ts
└── plugins/                       # Example custom plugins
    └── zod-schemas/
        ├── package.json
        └── src/
            └── index.ts
```

#### Milestones

| Milestone | Description | Acceptance Criteria |
|-----------|-------------|---------------------|
| M2.1 | Plugin runtime | Load, initialize, execute plugins |
| M2.2 | TypeScript types | Generate types matching Orval output |
| M2.3 | Enums | Generate enums with all variants |
| M2.4 | React Query | Hooks for all endpoint types |
| M2.5 | Vue Query | Composables for all endpoint types |
| M2.6 | Fetch client | Working typed client |
| M2.7 | Config system | Full config parsing and validation |
| M2.8 | Node.js host | Custom plugins in TypeScript |
| M2.9 | Feature parity | Match Orval output for test specs |

---

### Phase 3: Polish & Production Readiness

**Objective:** Production-ready release with documentation, distribution, and community support.

#### Deliverables

1. **Documentation**
   - Getting started guide
   - Configuration reference
   - Plugin development guide
   - Migration guide from Orval
   - API documentation

2. **Distribution**
   - npm package with native binaries
   - Homebrew formula
   - Docker image
   - GitHub releases

3. **Developer Experience**
   - Watch mode with incremental generation
   - Editor integration (VSCode extension)
   - Error messages with suggestions
   - `schema-gen init` wizard

4. **Advanced Features**
   - Remote spec fetching with caching
   - Spec diffing (show what changed)
   - Dry-run mode
   - Custom templates (EJS/Handlebars)

---

## Performance Targets

### Benchmarks

| Metric | Target | Measurement |
|--------|--------|-------------|
| Small spec (50 endpoints) | < 100ms | Cold start to complete output |
| Medium spec (200 endpoints) | < 500ms | Cold start to complete output |
| Large spec (500+ endpoints) | < 2s | Cold start to complete output |
| Memory (large spec) | < 500MB | Peak memory usage |
| Binary size | < 20MB | Standalone CLI binary |

### Comparison Baseline

Measure against:
- Orval (current generation)
- openapi-typescript
- swagger-codegen
- openapi-generator

---

## Testing Strategy

### Unit Tests
- AST node serialization/deserialization
- Type normalization logic
- Naming convention transformations
- Plugin utility functions

### Integration Tests
- End-to-end generation for fixture specs
- Output comparison with golden files
- Plugin interaction tests

### Fixture Specs
- Petstore (canonical example)
- GitHub API (large, real-world)
- Stripe API (complex types)
- Custom specs for edge cases:
  - Circular references
  - Deep nesting
  - allOf/anyOf/oneOf combinations
  - Discriminated unions
  - File uploads
  - Multipart forms

### Property-Based Tests
- Random valid OpenAPI specs
- Ensure no panics, valid output
- Round-trip AST serialization

---

## Open Questions

### Resolved Decisions ✅

1. **Plugin Runtime Strategy** → **Hybrid NAPI-RS Approach**
   - ✅ Rust core via NAPI-RS for performance-critical operations
   - ✅ Node.js plugin host for custom TypeScript plugins
   - ✅ WASM fallback for browser/Deno environments
   - See [Runtime Architecture: The Oxide Pattern](#runtime-architecture-the-oxide-pattern)

2. **Rust OpenAPI Crate** → **`openapiv3`**
   - ✅ 5.3M+ downloads, well-maintained
   - ✅ Used by Oxide's `progenitor` generator
   - ✅ Full OpenAPI v3.0/3.1 support with serde

### Technical Decisions Still Needed

1. **AST Serialization Format**
   - JSON (universal, verbose)? ← Likely default
   - MessagePack (compact, binary) for internal use?
   - Multiple formats for different use cases?

2. **Template Engine (for custom plugins)**
   - Handlebars (familiar, limited logic)?
   - EJS (JavaScript, maximum flexibility)? ← Likely choice for JS ecosystem
   - Code generation without templates (direct string building)?

3. **Naming Convention Handling**
   - Automatic detection from spec?
   - User configuration required?
   - Sensible defaults with override capability?

4. **Breaking Change Detection**
   - Strict (fail on breaking change)?
   - Warn only?
   - Configurable per-project?

### Community Input Needed

1. Which output formats are highest priority after TypeScript types?
2. What Orval features are must-haves vs nice-to-haves?
3. Are there specific pain points with current tools to address?
4. Interest in contributing plugins?
5. Preference for monorepo package manager (pnpm recommended by NAPI-RS)?

---

## Appendix

### A. Orval Feature Parity Checklist

| Feature | Priority | Phase |
|---------|----------|-------|
| TypeScript types generation | P0 | 2 |
| React Query hooks | P0 | 2 |
| Vue Query composables | P0 | 2 |
| Axios client | P1 | 2 |
| Fetch client | P1 | 2 |
| Angular client | P2 | 3 |
| Svelte Query | P2 | 3 |
| MSW mock generation | P1 | 2 |
| Zod schema generation | P1 | 2 |
| Custom fetch implementation | P0 | 2 |
| Transform hooks | P0 | 2 |
| Tag-based filtering | P1 | 2 |
| Custom templates | P2 | 3 |
| Watch mode | P1 | 3 |
| Spec validation | P0 | 1 |

### B. Rust Crate Dependencies (Initial)

**schema-gen-core/Cargo.toml:**
```toml
[dependencies]
# OpenAPI parsing
openapiv3 = "2.0"
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"
serde_yaml = "0.9"

# Error handling
miette = { version = "7.0", features = ["fancy"] }
thiserror = "1.0"

# Utilities
indexmap = { version = "2.0", features = ["serde"] }
url = "2.5"
regex = "1.10"

# Async (optional, for remote specs)
tokio = { version = "1.0", features = ["full"], optional = true }
reqwest = { version = "0.12", optional = true }
```

**schema-gen-binding/Cargo.toml:**
```toml
[dependencies]
# NAPI-RS for Node.js bindings
napi = { version = "2", features = ["serde-json", "async"] }
napi-derive = "2"

# Core library
schema-gen-core = { path = "../schema-gen-core" }

[build-dependencies]
napi-build = "2"
```

**schema-gen-cli/Cargo.toml:**
```toml
[dependencies]
# CLI framework
clap = { version = "4.0", features = ["derive"] }

# Core library
schema-gen-core = { path = "../schema-gen-core" }
```

### C. References

**Inspiration & Prior Art:**
- [Orval Documentation](https://orval.dev/)
- [Progenitor (Oxide OpenAPI Generator)](https://github.com/oxidecomputer/progenitor)

**Rust-Node.js Integration:**
- [NAPI-RS Documentation](https://napi.rs/)
- [NAPI-RS v2 Announcement](https://napi.rs/blog/announce-v2)
- [Tailwind CSS v4 Alpha (Oxide)](https://tailwindcss.com/blog/tailwindcss-v4-alpha)
- [Rolldown](https://rolldown.rs/)
- [Rspack Architecture](https://rspack.rs/)
- [Lightning CSS](https://github.com/parcel-bundler/lightningcss)
- [OXC Project](https://github.com/oxc-project/oxc)
- [SWC](https://swc.rs/)

**Specifications & Libraries:**
- [OpenAPI Specification](https://spec.openapis.org/oas/latest.html)
- [Rust openapiv3 crate](https://docs.rs/openapiv3)
- [React Query](https://tanstack.com/query/latest)
- [Vue Query](https://tanstack.com/query/latest/docs/vue/overview)

---

*This document is a living plan and will be updated as development progresses and decisions are made.*
