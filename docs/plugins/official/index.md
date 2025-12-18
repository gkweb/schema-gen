# Official Plugins

Official plugins extend schema-gen with framework-specific code generation. These are published as separate npm packages.

## Available Plugins

| Plugin | Package | Framework |
|--------|---------|-----------|
| [React Query v5](/plugins/official/react-query-v5) | `@schema-gen/plugin-react-query-v5` | React + TanStack Query |
| [Vue Query v4](/plugins/official/vue-query-v4) | `@schema-gen/plugin-vue-query-v4` | Vue + TanStack Query |

## Installation

Install the plugin package alongside the core:

::: code-group

```bash [React Query]
pnpm add @schema-gen/plugin-react-query-v5
```

```bash [Vue Query]
pnpm add @schema-gen/plugin-vue-query-v4
```

:::

## Usage

Import and configure the plugin in your config file:

```ts
import { defineConfig } from '@schema-gen/core';
import { reactQueryV5 } from '@schema-gen/plugin-react-query-v5';

export default defineConfig({
  input: { path: './openapi.yaml' },
  output: { dir: './src/api' },
  plugins: [
    'typescript-types',
    'typescript-enums',
    reactQueryV5({
      baseUrl: '/api',
    }),
  ],
});
```

## Common Features

Both React Query and Vue Query plugins share these features:

### Query/Mutation Classification

- **GET, HEAD, OPTIONS** → `useQuery` hooks
- **POST, PUT, PATCH, DELETE** → `useMutation` hooks

### Generated Exports

Each plugin generates:

1. **Query key functions** - For cache invalidation and prefetching
2. **Query options builders** - For SSR/prefetching
3. **Hook functions** - `useQuery` / `useMutation` wrappers

### Type Safety

- Request parameters are fully typed
- Response types are inferred from OpenAPI schemas
- Path parameter interpolation is type-safe

### Per-Operation Overrides

Customize generation for specific operations:

```ts
reactQueryV5({
  overrides: {
    getUser: {
      responseType: 'CustomUser',
    },
    legacyEndpoint: {
      skip: true,
    },
  },
});
```
