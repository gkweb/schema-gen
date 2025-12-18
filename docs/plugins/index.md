# Plugins

schema-gen uses a plugin architecture to generate code from OpenAPI specifications. Plugins can transform the AST, emit files, and post-process generated output.

## Plugin Types

### Built-in Plugins

These plugins are included with `@schema-gen/core` and can be referenced by name:

| Plugin | Description |
|--------|-------------|
| [`typescript-types`](/plugins/built-in/typescript-types) | TypeScript interfaces and type aliases |
| [`typescript-enums`](/plugins/built-in/typescript-enums) | TypeScript enums or union types |
| [`constants`](/plugins/built-in/constants) | Endpoint paths and HTTP method constants |
| [`request-paths`](/plugins/built-in/request-paths) | Typed path builder functions |

### Official Plugins

These plugins are published as separate npm packages:

| Plugin | Package | Description |
|--------|---------|-------------|
| [React Query v5](/plugins/official/react-query-v5) | `@schema-gen/plugin-react-query-v5` | TanStack React Query hooks |
| [Vue Query v4](/plugins/official/vue-query-v4) | `@schema-gen/plugin-vue-query-v4` | TanStack Vue Query composables |

## Using Plugins

Plugins are configured in the `plugins` array of your config file:

```ts
import { defineConfig } from '@schema-gen/core';
import { reactQueryV5 } from '@schema-gen/plugin-react-query-v5';

export default defineConfig({
  input: { path: './openapi.yaml' },
  output: { dir: './src/api' },
  plugins: [
    // Built-in plugin by name
    'typescript-types',
    'typescript-enums',

    // Built-in plugin with config
    {
      name: 'request-paths',
      config: {
        suffix: 'Url',
        fileName: 'urls.ts',
      },
    },

    // NPM package by name
    '@schema-gen/plugin-react-query-v5',

    // Imported plugin with config
    reactQueryV5({
      baseUrl: '/api',
      useInfiniteQuery: true,
    }),

    // Local file path
    './plugins/custom-plugin.ts',
  ],
});
```

## Plugin Order

Plugins execute in the order they are defined. This matters when:

- One plugin modifies the AST that another plugin reads
- One plugin generates files that another plugin post-processes
- You want to control the order of generated exports

## Creating Custom Plugins

See the [Creating Plugins](/plugins/creating-plugins) guide for how to build your own plugins using the Plugin SDK.
