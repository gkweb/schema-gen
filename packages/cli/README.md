# @schema-gen/cli

> CLI for [schema-gen](https://github.com/gkweb/schema-gen) — OpenAPI to TypeScript / React Query / Vue Query code generation.

Provides the `schema-gen` binary. Reads a `schema-gen.config.{ts,js,yaml,json}` from your project, parses your OpenAPI spec via the Rust-powered core, and writes generated code to the configured output directory.

## Install

Project-local (recommended — pin the version with the rest of your toolchain):

```bash
pnpm add -D @schema-gen/cli
# or
npm install --save-dev @schema-gen/cli
# or
yarn add -D @schema-gen/cli
```

Global:

```bash
pnpm add -g @schema-gen/cli
```

Or run without installing:

```bash
npx @schema-gen/cli generate
```

## Quick start

```bash
schema-gen init                 # create a starter schema-gen.config.ts
schema-gen generate             # generate code using the config
schema-gen generate -w          # watch mode
```

## Commands

| Command | Description |
|---|---|
| `generate [spec]` (alias `gen`) | Generate code from an OpenAPI spec. Flags: `-c, --config <path>`, `-i, --input <path>`, `-o, --output <dir>`, `-w, --watch` |
| `validate <spec>` | Validate that a spec parses cleanly |
| `ast <spec>` | Print the parsed AST. Flags: `-f, --format <json\|yaml>`, `-o, --output <path>` |
| `init` | Scaffold a `schema-gen.config.ts`. Flag: `-f, --force` to overwrite |
| `--version`, `--help` | Standard |

A positional `[spec]` arg or `-i/--input` overrides `input.path` from the config; `-o/--output` overrides `output.dir`.

## Example

```yaml
# schema-gen.config.yaml
input:
  path: ./openapi.yaml
output:
  dir: ./src/api
  clean: true
plugins:
  - typescript-types
  - typescript-enums
  - request-paths
```

```bash
schema-gen generate
```

## Documentation

- Repository: <https://github.com/gkweb/schema-gen>
- CLI reference: [docs/guide/cli.md](https://github.com/gkweb/schema-gen/blob/main/docs/guide/cli.md)
- Configuration: [docs/guide/configuration.md](https://github.com/gkweb/schema-gen/blob/main/docs/guide/configuration.md)
- Changelog: [`CHANGELOG.md`](./CHANGELOG.md)

## License

MIT © [gkweb](https://github.com/gkweb)
