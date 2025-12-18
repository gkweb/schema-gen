# API Reference

This section provides detailed API documentation for schema-gen packages.

## Packages

| Package | Description |
|---------|-------------|
| [@schema-gen/core](/api/core) | Core library with generator, config, and native bindings |
| [@schema-gen/plugin-sdk](/api/plugin-sdk) | SDK for creating custom plugins |
| [AST Types](/api/types) | Type definitions for the Abstract Syntax Tree |

## Quick Reference

### Core Exports

```ts
import {
  // Configuration
  defineConfig,
  loadConfig,
  loadConfigFromFile,
  validateConfig,
  createDefaultConfig,

  // Generator
  createGenerator,

  // Spec Utilities
  parseSpec,
  parseSpecToJson,
  validateSpec,

  // Version
  getVersion,

  // Types
  type UserConfig,
  type SchemaGenConfig,
  type SchemaAst,
  type GeneratedFile,
} from '@schema-gen/core';
```

### Plugin SDK Exports

```ts
import {
  // Plugin Definition
  definePlugin,
  createPluginContext,

  // Types
  type Plugin,
  type PluginContext,
  type FinishedContext,
  type PluginUtils,
  type PluginBinding,
  type Logger,
  type WrittenFile,

  // AST Types (re-exported from core)
  type SchemaAst,
  type TypeNode,
  type EnumNode,
  type EndpointNode,
  type GeneratedFile,
  // ... and more
} from '@schema-gen/plugin-sdk';
```

## Generated API Docs

For auto-generated API documentation from TypeScript source, see the generated reference in the `/api/generated` directory (if TypeDoc is configured).
