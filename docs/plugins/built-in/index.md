# Built-in Plugins

schema-gen includes four built-in plugins that handle common code generation tasks. These plugins are included with `@schema-gen/core` and can be referenced by name in your configuration.

## Available Plugins

| Plugin | Output File | Description |
|--------|-------------|-------------|
| [typescript-types](/plugins/built-in/typescript-types) | `types.ts` | TypeScript interfaces and type aliases |
| [typescript-enums](/plugins/built-in/typescript-enums) | `enums.ts` | TypeScript enums or union types |
| [constants](/plugins/built-in/constants) | `constants.ts` | API endpoint constants |
| [request-paths](/plugins/built-in/request-paths) | `paths.ts` | Typed path builder functions |

## Usage

Reference built-in plugins by name:

```ts
export default defineConfig({
  // ...
  plugins: [
    'typescript-types',
    'typescript-enums',
    'constants',
    'request-paths',
  ],
});
```

## Configuration

Built-in plugins can be configured using object syntax:

```ts
export default defineConfig({
  // ...
  plugins: [
    'typescript-types',
    'typescript-enums',
    {
      name: 'request-paths',
      config: {
        suffix: 'Url',
        fileName: 'api-urls.ts',
        includeJsDoc: false,
      },
    },
  ],
});
```

## Rust-Powered Generation

The `typescript-types`, `typescript-enums`, and `constants` plugins use the Rust core for code generation. This provides:

- **Maximum performance** - Native code execution
- **Consistency** - Same output across all platforms
- **Reliability** - Well-tested generation logic
