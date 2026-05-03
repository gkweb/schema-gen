# @schema-gen/plugin-sdk

> SDK for building custom [schema-gen](https://github.com/gkweb/schema-gen) plugins.

Exposes the `Plugin` interface, lifecycle hook signatures, AST type re-exports, and the `definePlugin()` helper for type-safe plugin authoring.

## Install

```bash
pnpm add @schema-gen/plugin-sdk
# or
npm install @schema-gen/plugin-sdk
# or
yarn add @schema-gen/plugin-sdk
```

## Usage

```ts
import { definePlugin } from '@schema-gen/plugin-sdk';

export default definePlugin({
  id: 'my-custom-plugin',
  name: 'My Custom Plugin',
  version: '1.0.0',

  async emit(context) {
    const { ast, utils } = context;

    return [
      {
        path: 'custom.ts',
        content: `// Generated for ${ast.info.title}\n`,
      },
    ];
  },
});
```

## Plugin lifecycle

Plugins can opt into any subset of the following hooks (all optional):

| Phase | Hook | Purpose |
|---|---|---|
| 0 — Pre-parse | `onSpec(rawSpec, ctx)` | Mutate the raw OpenAPI document before AST construction |
| 1 — Init | `onStart(ctx)` | One-time setup once the AST is built |
| 2 — AST filter / mutate | `onType`, `onEnum`, `onEndpoint` | Per-node hook; return modified node, `null` to drop, or `void` to keep |
| 3 — Emit | `emit(ctx)` | Return the `GeneratedFile[]` your plugin produces |
| 4 — Post-process | `onFile(file, ctx)` | Per-emitted-file hook (any plugin's file) |
| 5 — Cleanup | `onEnd(ctx)` | One-time teardown after all plugins emit |
| 6 — Post-write | `onFinished(ctx)` | After files are written to disk; receives `WrittenFile[]` |

`PluginContext` provides `ast`, `outputDir`, `configDir`, a `log` logger, a shared `Map` for cross-plugin state, naming utilities (`toPascalCase`, `toCamelCase`, `toKebabCase`, ...), AST helpers (`getEndpointsByTag`, `isQuery`, `isMutation`, `typeRefToString`), and a `binding` for invoking the native Rust generators directly.

## Documentation

- Repository: <https://github.com/gkweb/schema-gen>
- Creating plugins: [docs/plugins/creating-plugins.md](https://github.com/gkweb/schema-gen/blob/main/docs/plugins/creating-plugins.md)
- Lifecycle reference: [docs/plugins/lifecycle.md](https://github.com/gkweb/schema-gen/blob/main/docs/plugins/lifecycle.md)
- Plugin SDK API: [docs/api/plugin-sdk.md](https://github.com/gkweb/schema-gen/blob/main/docs/api/plugin-sdk.md)
- Changelog: [`CHANGELOG.md`](./CHANGELOG.md)

## License

MIT © [gkweb](https://github.com/gkweb)
