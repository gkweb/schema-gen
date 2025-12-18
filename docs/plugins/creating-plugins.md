# Creating Plugins

This guide shows you how to create custom schema-gen plugins using the Plugin SDK.

## Installation

```bash
pnpm add -D @schema-gen/plugin-sdk
```

## Basic Plugin Structure

```ts
import { definePlugin, type PluginContext } from '@schema-gen/plugin-sdk';

export default definePlugin({
  id: 'my-plugin',
  name: 'My Custom Plugin',
  version: '1.0.0',

  async emit(context) {
    // Generate files
    return [
      {
        path: 'output.ts',
        content: '// Generated code',
      },
    ];
  },
});
```

## Plugin Interface

```ts
interface Plugin {
  // Metadata (required)
  id: string;
  name: string;
  version: string;

  // Dependencies (optional)
  dependencies?: string[];

  // Lifecycle hooks (all optional)
  onStart?(context: PluginContext): void | Promise<void>;
  onType?(node: TypeNode, context: PluginContext): TypeNode | null | void;
  onEnum?(node: EnumNode, context: PluginContext): EnumNode | null | void;
  onEndpoint?(node: EndpointNode, context: PluginContext): EndpointNode | null | void;
  emit?(context: PluginContext): GeneratedFile[] | Promise<GeneratedFile[]>;
  onFile?(file: GeneratedFile, context: PluginContext): GeneratedFile | null | void;
  onEnd?(context: PluginContext): void | Promise<void>;
  onFinished?(context: FinishedContext): void | Promise<void>;
}
```

## Plugin Context

Every hook receives a `PluginContext` object:

```ts
interface PluginContext {
  // The full AST
  ast: SchemaAst;

  // Plugin configuration from user config
  config: Record<string, unknown>;

  // Output directories
  outputDir: string;
  typesDir?: string;
  configDir: string;

  // Logging
  log: Logger;

  // Shared state between plugins
  shared: Map<string, unknown>;

  // Utility functions
  utils: PluginUtils;

  // Access to Rust generators
  binding: PluginBinding;
}
```

## Example: Simple Plugin

Generate a summary file listing all endpoints:

```ts
import { definePlugin } from '@schema-gen/plugin-sdk';

export default definePlugin({
  id: 'api-summary',
  name: 'API Summary',
  version: '1.0.0',

  emit(ctx) {
    const lines = [
      '# API Summary',
      '',
      `API: ${ctx.ast.info.title} v${ctx.ast.info.version}`,
      '',
      '## Endpoints',
      '',
    ];

    for (const endpoint of ctx.ast.endpoints) {
      const summary = endpoint.summary || endpoint.operationId || 'No description';
      lines.push(`- \`${endpoint.method} ${endpoint.path}\` - ${summary}`);
    }

    return [
      {
        path: 'API_SUMMARY.md',
        content: lines.join('\n'),
      },
    ];
  },
});
```

## Example: Configurable Plugin

```ts
import { definePlugin, type Plugin } from '@schema-gen/plugin-sdk';

export interface MyPluginConfig {
  fileName?: string;
  includeComments?: boolean;
}

export function myPlugin(config?: MyPluginConfig): Plugin {
  const fileName = config?.fileName ?? 'output.ts';
  const includeComments = config?.includeComments ?? true;

  return {
    id: 'my-plugin',
    name: 'My Plugin',
    version: '1.0.0',

    emit(ctx) {
      let content = '';

      if (includeComments) {
        content += `// Generated from ${ctx.ast.info.title}\n\n`;
      }

      // Generate code...

      return [{ path: fileName, content }];
    },
  };
}
```

Usage:

```ts
import { myPlugin } from './my-plugin';

export default defineConfig({
  plugins: [
    myPlugin({ fileName: 'custom.ts', includeComments: false }),
  ],
});
```

## Example: API Client Plugin

Generate a typed API client:

```ts
import { definePlugin, type EndpointNode } from '@schema-gen/plugin-sdk';

export default definePlugin({
  id: 'api-client',
  name: 'API Client Generator',
  version: '1.0.0',

  emit(ctx) {
    const imports: string[] = [];
    const methods: string[] = [];

    for (const endpoint of ctx.ast.endpoints) {
      const name = ctx.utils.toCamelCase(endpoint.operationId || endpoint.id);
      const responseType = getResponseType(endpoint);

      if (responseType !== 'unknown') {
        imports.push(responseType);
      }

      const pathParams = endpoint.parameters?.filter(p => p.location === 'path') ?? [];
      const hasPathParams = pathParams.length > 0;

      let path = endpoint.path;
      if (hasPathParams) {
        for (const param of pathParams) {
          path = path.replace(`{${param.name}}`, `\${params.${param.name}}`);
        }
      }

      const params = hasPathParams
        ? `params: { ${pathParams.map(p => `${p.name}: string`).join('; ')} }`
        : '';

      methods.push(`
  async ${name}(${params}): Promise<${responseType}> {
    const response = await fetch(\`${path}\`, {
      method: '${endpoint.method}',
    });
    return response.json();
  }`);
    }

    const uniqueImports = [...new Set(imports)].filter(i => i !== 'unknown');

    const content = `
import type { ${uniqueImports.join(', ')} } from './types';

export class ApiClient {
${methods.join('\n')}
}

export const apiClient = new ApiClient();
`;

    return [{ path: 'client.ts', content: content.trim() + '\n' }];
  },
});

function getResponseType(endpoint: EndpointNode): string {
  const response = endpoint.responses?.find(r => {
    if (typeof r.statusCode === 'object' && 'code' in r.statusCode) {
      return r.statusCode.code >= 200 && r.statusCode.code < 300;
    }
    return r.statusCode === 'default';
  });

  const content = response?.content?.find(c => c.mediaType === 'application/json');

  if (content?.typeRef?.kind === 'named') {
    return content.typeRef.name;
  }

  return 'unknown';
}
```

## Using the Rust Binding

Call built-in generators from the Rust core:

```ts
import { definePlugin } from '@schema-gen/plugin-sdk';

export default definePlugin({
  id: 'custom-types',
  name: 'Custom Types',
  version: '1.0.0',

  emit(ctx) {
    // Use Rust generator for types
    const typeFiles = ctx.binding.generateTypes(ctx.ast);

    // Add custom modifications
    return typeFiles.map(file => ({
      ...file,
      content: `// Custom header\n${file.content}`,
    }));
  },
});
```

## Plugin Utilities

The `utils` object provides helpful functions:

```ts
// Naming conventions
ctx.utils.toPascalCase('user_name');      // 'UserName'
ctx.utils.toCamelCase('user_name');       // 'userName'
ctx.utils.toSnakeCase('userName');        // 'user_name'
ctx.utils.toScreamingSnakeCase('user');   // 'USER'
ctx.utils.toKebabCase('userName');        // 'user-name'

// Type utilities
ctx.utils.typeRefToString(typeRef);       // 'User[]'

// Endpoint utilities
ctx.utils.getEndpointsByTag('users');     // EndpointNode[]
ctx.utils.isQuery(endpoint);              // true for GET/HEAD/OPTIONS
ctx.utils.isMutation(endpoint);           // true for POST/PUT/PATCH/DELETE
```

## Sharing State Between Plugins

Use the `shared` map to pass data between plugins:

```ts
// Plugin A
onEnd(ctx) {
  ctx.shared.set('myPlugin:endpoints', processedEndpoints);
}

// Plugin B (runs after A)
emit(ctx) {
  const endpoints = ctx.shared.get('myPlugin:endpoints');
  // Use shared data
}
```

## Testing Plugins

Use `createPluginContext` for testing:

```ts
import { createPluginContext, type SchemaAst } from '@schema-gen/plugin-sdk';
import myPlugin from './my-plugin';

const mockAst: SchemaAst = {
  info: { title: 'Test API', version: '1.0.0' },
  types: {},
  enums: {},
  endpoints: [],
  tags: [],
};

const ctx = createPluginContext(mockAst, {
  outputDir: './output',
  config: { fileName: 'test.ts' },
});

const files = await myPlugin.emit?.(ctx);

expect(files).toHaveLength(1);
expect(files[0].path).toBe('test.ts');
```

## Best Practices

1. **Use `definePlugin`** for type safety
2. **Make plugins configurable** with sensible defaults
3. **Include JSDoc comments** in generated code
4. **Use `ctx.log`** for debugging messages
5. **Handle edge cases** (empty arrays, missing fields)
6. **Write tests** using `createPluginContext`
7. **Document your configuration** options
