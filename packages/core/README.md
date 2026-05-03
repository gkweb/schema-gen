# @schema-gen/core

> High-performance OpenAPI to TypeScript / React Query / Vue Query code generation, powered by Rust.

The core programmatic API for [schema-gen](https://github.com/gkweb/schema-gen). Parses OpenAPI 3.x specs into a typed AST and runs configured plugins against it. The heavy work (parsing, AST building, built-in TypeScript generation) runs in a native Rust binary via [napi-rs](https://napi.rs/), so installs ship a small platform-specific addon (darwin-arm64, linux-x64-gnu/musl, linux-arm64-gnu/musl, win32-x64-msvc, win32-arm64-msvc) as an optional dependency.

Most users will install [`@schema-gen/cli`](https://www.npmjs.com/package/@schema-gen/cli) and never touch this package directly — reach for `@schema-gen/core` when you need to drive generation from a build script, plugin, or tool.

## Install

```bash
pnpm add @schema-gen/core
# or
npm install @schema-gen/core
# or
yarn add @schema-gen/core
```

## Usage

### Define a config

```ts
import { defineConfig, plugins } from '@schema-gen/core';

export default defineConfig({
  input: { path: './openapi.yaml' },
  output: { dir: './src/api' },
  plugins: [
    plugins.typescriptTypes({ preferInterfaces: true }),
    plugins.typescriptEnums({ enumStyle: 'union' }),
    plugins.requestPaths(),
  ],
});
```

### Run programmatically

```ts
import { createGenerator, loadConfig } from '@schema-gen/core';

const { config } = (await loadConfig())!;
const generator = await createGenerator({ config });

await generator.generate(); // parse + run plugins + write to disk
```

### Built-in plugin helpers

Exposed under the `plugins` export:

| Helper | Output |
|---|---|
| `plugins.typescriptTypes(config?)` | TypeScript interfaces / type aliases |
| `plugins.typescriptEnums(config?)` | TypeScript enums or union types |
| `plugins.constants(config?)` | Endpoint path & HTTP method constants |
| `plugins.requestPaths(config?)` | Tree-shakable typed path-builder functions |

For TanStack Query support, install one of the official plugin packages:

- [`@schema-gen/plugin-react-query-v5`](https://www.npmjs.com/package/@schema-gen/plugin-react-query-v5)
- [`@schema-gen/plugin-vue-query-v4`](https://www.npmjs.com/package/@schema-gen/plugin-vue-query-v4)

## Public API surface

- `createGenerator(options)` — high-level generator with `.ast`, `.run()`, `.write()`, `.generate()`
- `defineConfig(config)` — typed config helper
- `loadConfig()` / `loadConfigFromFile(path)` — discover/load `schema-gen.config.{ts,js,yaml,json}`
- `validateConfig(config)`, `validateSpec(spec)`
- `parseSpec(spec)`, `parseSpecToJson(spec)` — direct AST access
- `getVersion()`, `createDefaultConfig()`
- `plugins` — typed helpers for built-in plugins (see above)

Full API reference: [docs/api/core.md](https://github.com/gkweb/schema-gen/blob/main/docs/api/core.md).

## Documentation

- Repository: <https://github.com/gkweb/schema-gen>
- Guide: [docs/guide](https://github.com/gkweb/schema-gen/tree/main/docs/guide)
- Changelog: [`CHANGELOG.md`](./CHANGELOG.md)

## License

MIT © [gkweb](https://github.com/gkweb)
