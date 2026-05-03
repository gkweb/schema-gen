# @schema-gen/plugin-vue-query-v4

> Official [schema-gen](https://github.com/gkweb/schema-gen) plugin that generates [TanStack Vue Query v4](https://tanstack.com/query/v4/docs/framework/vue/overview) composables from your OpenAPI spec.

Generates `useQuery` composables for safe (GET / HEAD / OPTIONS) endpoints and `useMutation` composables for the rest, with optional `useInfiniteQuery` / `useSuspenseQuery` and exported query keys / query options.

## Install

```bash
pnpm add @schema-gen/plugin-vue-query-v4
pnpm add @tanstack/vue-query vue        # peers
```

```bash
npm install @schema-gen/plugin-vue-query-v4
npm install @tanstack/vue-query vue
```

Peer dependencies: `@tanstack/vue-query 4.37.1`, `vue >=2.7.0 || >=3.0.0`.

## Usage

```ts
// schema-gen.config.ts
import { defineConfig } from '@schema-gen/core';
import vueQueryV4 from '@schema-gen/plugin-vue-query-v4';

export default defineConfig({
  input: { path: './openapi.yaml' },
  output: { dir: './src/api' },
  plugins: [
    vueQueryV4(),
    // or with options:
    vueQueryV4({
      fileName: 'queries.ts',
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
| `fileName` | `'queries.ts'` | Output file name |
| `useQuery` | `true` | Generate `useQuery` composables for GET endpoints |
| `useMutation` | `true` | Generate `useMutation` composables for non-GET endpoints |
| `useInfiniteQuery` | `false` | Also generate `useInfiniteQuery` composables |
| `infiniteQueryParam` | `'cursor'` | Param name used for infinite-query pagination |
| `useSuspenseQuery` | `false` | Also generate `useSuspenseQuery` composables |
| `exportQueryKeys` | — | Export query-key factories |
| `exportQueryOptions` | — | Export `queryOptions(...)` helpers |

See [docs/plugins/official/vue-query-v4.md](https://github.com/gkweb/schema-gen/blob/main/docs/plugins/official/vue-query-v4.md) for the full reference.

## Documentation

- Repository: <https://github.com/gkweb/schema-gen>
- Plugin docs: [docs/plugins/official/vue-query-v4.md](https://github.com/gkweb/schema-gen/blob/main/docs/plugins/official/vue-query-v4.md)
- Changelog: [`CHANGELOG.md`](./CHANGELOG.md)

## License

MIT © [gkweb](https://github.com/gkweb)
