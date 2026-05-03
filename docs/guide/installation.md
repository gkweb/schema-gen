# Installation

## Prerequisites

- **Node.js** 18 or higher
- **pnpm**, **npm**, or **yarn** package manager

## Installing the Packages

Install the core library and CLI:

::: code-group

```bash [pnpm]
pnpm add @schema-gen/core @schema-gen/cli
```

```bash [npm]
npm install @schema-gen/core @schema-gen/cli
```

```bash [yarn]
yarn add @schema-gen/core @schema-gen/cli
```

:::

## Optional: Framework Plugins

### React Query v5

For generating TanStack React Query hooks:

::: code-group

```bash [pnpm]
pnpm add @schema-gen/plugin-react-query-v5
```

```bash [npm]
npm install @schema-gen/plugin-react-query-v5
```

```bash [yarn]
yarn add @schema-gen/plugin-react-query-v5
```

:::

### Vue Query v4

For generating TanStack Vue Query composables:

::: code-group

```bash [pnpm]
pnpm add @schema-gen/plugin-vue-query-v4
```

```bash [npm]
npm install @schema-gen/plugin-vue-query-v4
```

```bash [yarn]
yarn add @schema-gen/plugin-vue-query-v4
```

:::

## Plugin SDK

For creating custom plugins:

::: code-group

```bash [pnpm]
pnpm add -D @schema-gen/plugin-sdk
```

```bash [npm]
npm install -D @schema-gen/plugin-sdk
```

```bash [yarn]
yarn add -D @schema-gen/plugin-sdk
```

:::

## Native Bindings

schema-gen includes pre-built native bindings for the following platforms:

- **macOS** (x64, arm64)
- **Linux** (x64, arm64)
- **Windows** (x64)

The appropriate binary is automatically selected when you install `@schema-gen/core`.

::: tip
If your platform is not supported, please [open an issue](https://github.com/gkweb/schema-gen/issues) on GitHub.
:::

## Verify Installation

After installation, verify it works:

```bash
npx schema-gen --version
```

You should see output like:

```
0.2.0
```

## Next Steps

Now that you have schema-gen installed, proceed to the [Quick Start](/guide/quick-start) guide to generate your first code.
