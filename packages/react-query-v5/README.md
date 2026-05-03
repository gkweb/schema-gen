# @schema-gen/plugin-react-query-v5

> Official [schema-gen](https://github.com/gkweb/schema-gen) plugin that generates [TanStack React Query v5](https://tanstack.com/query/v5) hooks from your OpenAPI spec.

Generates `useQuery` hooks for safe (GET / HEAD / OPTIONS) endpoints and `useMutation` hooks for the rest, with optional `useInfiniteQuery` and `useSuspenseQuery` support and exported query keys / query options for cache manipulation.

## Install

```bash
pnpm add @schema-gen/plugin-react-query-v5
pnpm add @tanstack/react-query react   # peers
```

```bash
npm install @schema-gen/plugin-react-query-v5
npm install @tanstack/react-query react
```

Peer dependencies: `@tanstack/react-query >=5.0.0`, `react >=18.0.0`.

## Usage

```ts
// schema-gen.config.ts
import { defineConfig } from '@schema-gen/core';
import reactQueryV5 from '@schema-gen/plugin-react-query-v5';

export default defineConfig({
  input: { path: './openapi.yaml' },
  output: { dir: './src/api' },
  plugins: [
    reactQueryV5(),
    // or with options:
    reactQueryV5({
      fileName: 'hooks.ts',
      useInfiniteQuery: true,
      useSuspenseQuery: true,
      exportQueryKeys: true,
      exportQueryOptions: true,
    }),
  ],
});
```

## Configuration

| Option | Default | Purpose |
|---|---|---|
| `fileName` | `'hooks.ts'` | Output file name |
| `useQuery` | `true` | Generate `useQuery` hooks for GET endpoints |
| `useMutation` | `true` | Generate `useMutation` hooks for non-GET endpoints |
| `useInfiniteQuery` | `false` | Also generate `useInfiniteQuery` hooks |
| `infiniteQueryParam` | `'cursor'` | Param name used for infinite-query pagination |
| `useSuspenseQuery` | `false` | Also generate `useSuspenseQuery` hooks |
| `exportQueryKeys` | — | Export query-key factories |
| `exportQueryOptions` | — | Export `queryOptions(...)` helpers |
| `useOperationIdAsQueryKey` | — | Use OpenAPI `operationId` as query-key seed |

See [docs/plugins/official/react-query-v5.md](https://github.com/gkweb/schema-gen/blob/main/docs/plugins/official/react-query-v5.md) for the full reference.

## Documentation

- Repository: <https://github.com/gkweb/schema-gen>
- Plugin docs: [docs/plugins/official/react-query-v5.md](https://github.com/gkweb/schema-gen/blob/main/docs/plugins/official/react-query-v5.md)
- Changelog: [`CHANGELOG.md`](./CHANGELOG.md)

## License

MIT © [gkweb](https://github.com/gkweb)
