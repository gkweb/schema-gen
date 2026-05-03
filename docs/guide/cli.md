# CLI Commands

The schema-gen CLI provides commands for generating code, validating specs, and debugging.

## Installation

The CLI is included in the `@schema-gen/cli` package:

```bash
pnpm add @schema-gen/cli
```

## Commands

### `generate`

Generate code from an OpenAPI specification.

```bash
schema-gen generate [spec] [options]
```

**Aliases:** `gen`

**Arguments:**

| Argument | Description |
|----------|-------------|
| `[spec]` | Path to OpenAPI specification (optional, uses config if not provided) |

**Options:**

| Option | Description |
|--------|-------------|
| `-c, --config <path>` | Path to configuration file |
| `-i, --input <path>` | Path to OpenAPI specification |
| `-o, --output <dir>` | Output directory |
| `-w, --watch` | Watch for changes and regenerate |

**Examples:**

```bash
# Use config file (auto-detected)
schema-gen generate

# Specify spec file
schema-gen generate ./openapi.yaml

# Override output directory
schema-gen generate -o ./src/generated

# Use specific config file
schema-gen generate --config ./configs/api.config.ts

# Watch mode
schema-gen generate --watch
```

**Priority:**

When multiple inputs are provided, they are resolved in this order:

1. Positional argument (`schema-gen generate ./spec.yaml`)
2. `-i, --input` option
3. Config file `input.path`

### `validate`

Validate an OpenAPI specification.

```bash
schema-gen validate <spec>
```

**Arguments:**

| Argument | Description |
|----------|-------------|
| `<spec>` | Path to OpenAPI specification (required) |

**Examples:**

```bash
# Validate a spec
schema-gen validate ./openapi.yaml

# Output on success:
# ✓ ./openapi.yaml is valid

# Output on failure:
# ✗ ./openapi.yaml is invalid
#   Missing required field: info.title
```

### `ast`

Output the Abstract Syntax Tree (AST) for debugging.

```bash
schema-gen ast <spec> [options]
```

**Arguments:**

| Argument | Description |
|----------|-------------|
| `<spec>` | Path to OpenAPI specification (required) |

**Options:**

| Option | Default | Description |
|--------|---------|-------------|
| `-f, --format <format>` | `json` | Output format: `json` or `yaml` |
| `-o, --output <path>` | stdout | Output file path |

**Examples:**

```bash
# Print AST to stdout
schema-gen ast ./openapi.yaml

# Save AST to file
schema-gen ast ./openapi.yaml -o ./ast.json

# Output as YAML
schema-gen ast ./openapi.yaml -f yaml
```

The AST output shows the internal representation that plugins work with, useful for debugging custom plugins.

### `init`

Initialize a new configuration file.

```bash
schema-gen init [options]
```

**Options:**

| Option | Description |
|--------|-------------|
| `-f, --force` | Overwrite existing configuration |

**Examples:**

```bash
# Create schema-gen.config.ts
schema-gen init

# Overwrite existing config
schema-gen init --force
```

Creates a default configuration file:

```ts
export default {
  input: {
    path: './openapi.yaml',
  },
  output: {
    dir: './src/api',
    clean: true,
  },
  plugins: [
    'typescript-types',
    'typescript-enums',
  ],
};
```

### `--version`

Display the version number.

```bash
schema-gen --version
# 0.2.0
```

### `--help`

Display help information.

```bash
schema-gen --help
schema-gen generate --help
```

## Exit Codes

| Code | Description |
|------|-------------|
| `0` | Success |
| `1` | Error (invalid config, parse error, etc.) |

## npm Scripts

Add commonly used commands to your `package.json`:

```json
{
  "scripts": {
    "api:generate": "schema-gen generate",
    "api:watch": "schema-gen generate --watch",
    "api:validate": "schema-gen validate ./openapi.yaml"
  }
}
```

Then run:

```bash
pnpm api:generate
pnpm api:watch
```

## CI/CD Usage

In CI environments, run generation and fail on errors:

```yaml
# GitHub Actions example
- name: Generate API types
  run: npx schema-gen generate

- name: Check for changes
  run: |
    if [[ -n $(git status --porcelain) ]]; then
      echo "Generated files are out of date"
      exit 1
    fi
```
