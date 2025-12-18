# Configuration

schema-gen is configured via a `schema-gen.config.ts` file in your project root.

## Config File Formats

Configuration files are searched in this order:

1. `schema-gen.config.ts` (recommended)
2. `schema-gen.config.js`
3. `schema-gen.config.mjs`

## Basic Configuration

```ts
import { defineConfig } from '@schema-gen/core';

export default defineConfig({
  input: {
    path: './openapi.yaml',
  },
  output: {
    dir: './src/api',
  },
  plugins: [
    'typescript-types',
    'typescript-enums',
  ],
});
```

## Full Configuration Reference

### `cwd`

Working directory for resolving relative paths. Defaults to the config file directory.

```ts
export default defineConfig({
  cwd: './apps/frontend',
  // ...
});
```

### `input`

Input specification configuration.

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `path` | `string` | **required** | Path to OpenAPI spec (local file or URL) |
| `validation` | `'strict' \| 'warn' \| 'off'` | `'warn'` | Validation strictness level |
| `parserOptions` | `ParserOptions` | - | Options for schema resolution |

```ts
export default defineConfig({
  input: {
    path: './openapi.yaml',
    // or remote URL
    // path: 'https://api.example.com/openapi.json',
    validation: 'strict',
    parserOptions: {
      resolve: {
        http: {
          headers: {
            Authorization: 'Bearer token',
          },
          timeout: 60000, // 60 seconds
        },
      },
    },
  },
  // ...
});
```

### `output`

Output configuration.

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `dir` | `string` | **required** | Output directory |
| `structure` | `'flat' \| 'by-tag' \| 'by-endpoint'` | `'flat'` | File organization strategy |
| `clean` | `boolean` | `false` | Clean output directory before generation |
| `types` | `TypesOutputConfig` | - | Separate directory for type definitions |

```ts
export default defineConfig({
  // ...
  output: {
    dir: './src/api',
    structure: 'by-tag',
    clean: true,
    types: {
      dir: 'types',  // Relative to output.dir
      barrel: true,  // Generate index.ts with re-exports
    },
  },
});
```

### `plugins`

Array of plugins to use. Plugins can be specified as:

- **String** - Built-in plugin name or npm package
- **Object** - Plugin with configuration
- **Plugin instance** - Imported plugin with config

```ts
import { defineConfig } from '@schema-gen/core';
import { reactQueryV5 } from '@schema-gen/plugin-react-query-v5';

export default defineConfig({
  // ...
  plugins: [
    // Built-in plugins (string)
    'typescript-types',
    'typescript-enums',
    'constants',
    'request-paths',

    // NPM package (string)
    '@schema-gen/plugin-react-query-v5',

    // Local file path
    './plugins/custom-plugin.ts',

    // Plugin with configuration
    {
      name: 'request-paths',
      config: {
        suffix: 'Url',
        fileName: 'urls.ts',
      },
    },

    // Imported plugin with config
    reactQueryV5({
      baseUrl: '/api',
      useInfiniteQuery: true,
    }),
  ],
});
```

### `transform`

Global transformation options.

| Option | Type | Description |
|--------|------|-------------|
| `naming` | `object` | Naming conventions for types, properties, enums |
| `typeOverrides` | `Record<string, string>` | Custom type mappings |
| `include` | `object` | Include filters (tags, paths) |
| `exclude` | `object` | Exclude filters (tags, operationIds) |

```ts
export default defineConfig({
  // ...
  transform: {
    naming: {
      types: 'PascalCase',      // 'PascalCase' | 'camelCase' | 'preserve'
      properties: 'camelCase',   // 'PascalCase' | 'camelCase' | 'snake_case' | 'preserve'
      enums: 'SCREAMING_SNAKE',  // 'PascalCase' | 'SCREAMING_SNAKE' | 'preserve'
    },
    typeOverrides: {
      // Map OpenAPI types to custom TypeScript types
      'Pet': 'import("./models").Pet',
      'DateTime': 'Date',
    },
    include: {
      tags: ['public', 'v2'],  // Only include these tags
      paths: ['/api/v2/**'],   // Only include these path patterns
    },
    exclude: {
      tags: ['internal', 'deprecated'],
      operationIds: ['legacyEndpoint'],
    },
  },
});
```

### `fetch`

Fetch client configuration.

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `default` | `'fetch' \| 'axios' \| 'ky' \| 'custom'` | `'fetch'` | Default fetch implementation |
| `custom` | `object` | - | Custom fetch function import |
| `overrides` | `Record<string, string>` | - | Per-endpoint fetch overrides |

```ts
export default defineConfig({
  // ...
  fetch: {
    default: 'custom',
    custom: {
      import: '@/lib/api',
      function: 'apiClient',
    },
    overrides: {
      uploadFile: 'uploadClient',  // Use different client for file uploads
    },
  },
});
```

### `reactQuery`

React Query specific options (used by React Query plugins).

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `queryKeys` | `'array' \| 'object'` | `'array'` | Query key factory style |
| `suspense` | `boolean` | `false` | Generate suspense-enabled queries |
| `infiniteQueries` | `object` | - | Infinite query detection settings |

```ts
export default defineConfig({
  // ...
  reactQuery: {
    queryKeys: 'array',
    suspense: true,
    infiniteQueries: {
      detectByParam: ['cursor', 'pageToken', 'offset'],
    },
  },
});
```

### `vueQuery`

Vue Query specific options (used by Vue Query plugins).

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `compositionApi` | `boolean` | `true` | Use Composition API style |

```ts
export default defineConfig({
  // ...
  vueQuery: {
    compositionApi: true,
  },
});
```

### `style`

Code style/formatting options.

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `semi` | `boolean` | `true` | Add semicolons |
| `quotes` | `'single' \| 'double'` | `'single'` | Quote style |
| `trailingComma` | `'all' \| 'es5' \| 'none'` | `'all'` | Trailing commas |
| `tabWidth` | `number` | `2` | Tab width |
| `useTabs` | `boolean` | `false` | Use tabs instead of spaces |
| `printWidth` | `number` | `100` | Line width |

```ts
export default defineConfig({
  // ...
  style: {
    semi: true,
    quotes: 'single',
    trailingComma: 'all',
    tabWidth: 2,
    useTabs: false,
    printWidth: 100,
  },
});
```

## Environment Variables

You can use environment variables in your configuration:

```ts
export default defineConfig({
  input: {
    path: process.env.OPENAPI_SPEC_URL || './openapi.yaml',
    parserOptions: {
      resolve: {
        http: {
          headers: {
            Authorization: `Bearer ${process.env.API_TOKEN}`,
          },
        },
      },
    },
  },
  // ...
});
```

## Multiple Configurations

For monorepos or multiple API specs, create separate config files and specify them with the `--config` flag:

```bash
npx schema-gen generate --config ./configs/api-v1.config.ts
npx schema-gen generate --config ./configs/api-v2.config.ts
```

## Type Safety

The `defineConfig` helper provides full TypeScript support with autocompletion and validation:

```ts
import { defineConfig } from '@schema-gen/core';

export default defineConfig({
  // ↑ Full autocomplete and type checking
});
```
