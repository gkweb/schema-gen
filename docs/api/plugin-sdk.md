# @schema-gen/plugin-sdk

The Plugin SDK provides types and utilities for creating custom schema-gen plugins.

## Installation

```bash
pnpm add -D @schema-gen/plugin-sdk
```

## Plugin Definition

### definePlugin

Create a plugin with type safety.

```ts
import { definePlugin } from '@schema-gen/plugin-sdk';

export default definePlugin({
  id: 'my-plugin',
  name: 'My Plugin',
  version: '1.0.0',

  emit(ctx) {
    return [{ path: 'output.ts', content: '// generated' }];
  },
});
```

### Plugin

Plugin interface definition.

```ts
interface Plugin {
  id: string;
  name: string;
  version: string;
  dependencies?: string[];

  onStart?(context: PluginContext): void | Promise<void>;
  onType?(node: TypeNode, context: PluginContext): TypeNode | null | void;
  onEnum?(node: EnumNode, context: PluginContext): EnumNode | null | void;
  onEndpoint?(node: EndpointNode, context: PluginContext): EndpointNode | null | void;
  emit?(context: PluginContext): GeneratedFile[] | Promise<GeneratedFile[]>;
  onFile?(file: GeneratedFile, context: PluginContext): GeneratedFile | null | void | Promise<...>;
  onEnd?(context: PluginContext): void | Promise<void>;
  onFinished?(context: FinishedContext): void | Promise<void>;
}
```

## Context Types

### PluginContext

Context provided to all plugin hooks.

```ts
interface PluginContext {
  ast: SchemaAst;
  config: Record<string, unknown>;
  outputDir: string;
  typesDir?: string;
  configDir: string;
  log: Logger;
  shared: Map<string, unknown>;
  utils: PluginUtils;
  binding: PluginBinding;
}
```

### FinishedContext

Extended context for `onFinished` hook.

```ts
interface FinishedContext extends PluginContext {
  files: WrittenFile[];
}
```

### WrittenFile

Information about a file written to disk.

```ts
interface WrittenFile {
  absolutePath: string;
  relativePath: string;
  content: string;
}
```

## Utilities

### PluginUtils

Helper functions available on `ctx.utils`.

```ts
interface PluginUtils {
  // Naming conventions
  toPascalCase(s: string): string;
  toCamelCase(s: string): string;
  toScreamingSnakeCase(s: string): string;
  toSnakeCase(s: string): string;
  toKebabCase(s: string): string;

  // Type utilities
  typeRefToString(ref: TypeRef): string;

  // Endpoint utilities
  getEndpointsByTag(tag: string): EndpointNode[];
  isQuery(endpoint: EndpointNode): boolean;
  isMutation(endpoint: EndpointNode): boolean;
}
```

### Logger

Logging interface.

```ts
interface Logger {
  debug(message: string): void;
  info(message: string): void;
  warn(message: string): void;
  error(message: string): void;
}
```

## Rust Binding

### PluginBinding

Interface for calling built-in Rust generators.

```ts
interface PluginBinding {
  generateTypes(ast: SchemaAst, options?: Record<string, unknown>): GeneratedFile[];
  generateEnums(ast: SchemaAst, options?: Record<string, unknown>): GeneratedFile[];
  generateConstants(ast: SchemaAst, options?: Record<string, unknown>): GeneratedFile[];
}
```

## Testing

### createPluginContext

Create a mock context for testing plugins.

```ts
import { createPluginContext } from '@schema-gen/plugin-sdk';

const ctx = createPluginContext(mockAst, {
  outputDir: './output',
  config: { fileName: 'test.ts' },
});

const files = await myPlugin.emit?.(ctx);
```

## Re-exported Types

The Plugin SDK re-exports all AST types from `@schema-gen/core`:

```ts
export type {
  SchemaAst,
  ApiInfo,
  ServerInfo,
  TagNode,
  TypeNode,
  TypeKind,
  PropertyNode,
  TypeRef,
  PrimitiveType,
  EnumNode,
  EnumVariant,
  EndpointNode,
  HttpMethod,
  ParameterNode,
  RequestBodyNode,
  ResponseNode,
  StatusCode,
  MediaTypeContent,
  HeaderNode,
  SecurityRequirement,
  GeneratedFile,
} from '@schema-gen/core';
```
