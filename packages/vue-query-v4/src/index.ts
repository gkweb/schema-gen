/**
 * Vue Query v4 Plugin for schema-gen
 *
 * Generates TanStack Vue Query v4 composables from OpenAPI specifications.
 * Produces useQuery hooks for GET endpoints and useMutation hooks for mutations.
 *
 * @example
 * ```typescript
 * import { defineConfig } from '@schema-gen/core';
 * import vueQueryV4 from '@schema-gen/plugin-vue-query-v4';
 *
 * export default defineConfig({
 *   input: { path: './openapi.yaml' },
 *   output: { dir: './src/api' },
 *   plugins: [
 *     vueQueryV4(),
 *     // or with config:
 *     vueQueryV4({ typesImportPath: './api-types' }),
 *   ],
 * });
 * ```
 */

import type { Plugin, EndpointNode, ParameterNode, TypeRef } from '@schema-gen/plugin-sdk';

// ============================================================================
// Configuration Types
// ============================================================================

/**
 * Vue Query v4 plugin configuration
 */
export interface VueQueryV4Config {
  /**
   * Output file name
   * @default 'queries.ts'
   */
  fileName?: string;

  /**
   * Generate useQuery hooks for GET endpoints
   * @default true
   */
  useQuery?: boolean;

  /**
   * Generate useMutation hooks for non-GET endpoints
   * @default true
   */
  useMutation?: boolean;

  /**
   * Generate useInfiniteQuery hooks
   * @default false
   */
  useInfiniteQuery?: boolean;

  /**
   * Parameter name used for infinite query pagination
   * @default 'cursor'
   */
  infiniteQueryParam?: string;

  /**
   * Generate useSuspenseQuery hooks
   * @default false
   */
  useSuspenseQuery?: boolean;

  /**
   * Export query key generators
   * @default true
   */
  exportQueryKeys?: boolean;

  /**
   * Export query options builders
   * @default true
   */
  exportQueryOptions?: boolean;

  /**
   * Use operation ID as base for query keys instead of path
   * @default true
   */
  useOperationIdAsQueryKey?: boolean;

  /**
   * Include JSDoc comments
   * @default true
   */
  includeJsDoc?: boolean;

  /**
   * Base URL for API calls
   * @default undefined (relative paths)
   */
  baseUrl?: string;

  /**
   * Import path for generated types
   * @default './types'
   */
  typesImportPath?: string;

  /**
   * Custom fetch function import. If not provided, uses native fetch.
   * @example { from: './api-client', name: 'apiClient' }
   */
  customFetch?: {
    from: string;
    name: string;
  };

  /**
   * Per-operation overrides for type customization
   * Keys are operation IDs
   */
  overrides?: Record<string, OperationOverride>;
}

/**
 * Per-operation override configuration
 */
export interface OperationOverride {
  /**
   * Override the response type
   */
  responseType?: string;

  /**
   * Override the request body type
   */
  requestBodyType?: string;

  /**
   * Override the params type
   */
  paramsType?: string;

  /**
   * Override the error type
   * @default 'Error'
   */
  errorType?: string;

  /**
   * Skip generating this operation entirely
   * @default false
   */
  skip?: boolean;

  /**
   * Force this operation to be a query (even if POST/PUT/etc)
   */
  forceQuery?: boolean;

  /**
   * Force this operation to be a mutation (even if GET)
   */
  forceMutation?: boolean;
}

interface ResolvedConfig {
  fileName: string;
  useQuery: boolean;
  useMutation: boolean;
  useInfiniteQuery: boolean;
  infiniteQueryParam: string;
  useSuspenseQuery: boolean;
  exportQueryKeys: boolean;
  exportQueryOptions: boolean;
  useOperationIdAsQueryKey: boolean;
  includeJsDoc: boolean;
  baseUrl: string;
  typesImportPath: string;
  customFetch?: { from: string; name: string };
  overrides: Record<string, OperationOverride>;
}

// ============================================================================
// Plugin Factory
// ============================================================================

/**
 * Create a Vue Query v4 plugin instance
 *
 * @param config - Plugin configuration options
 * @returns Configured plugin instance
 *
 * @example
 * ```typescript
 * // Basic usage
 * vueQueryV4()
 *
 * // With custom types import
 * vueQueryV4({ typesImportPath: './api-types' })
 *
 * // With custom fetch client
 * vueQueryV4({
 *   customFetch: { from: './api-client', name: 'apiClient' },
 * })
 *
 * // With operation overrides
 * vueQueryV4({
 *   overrides: {
 *     getUser: { responseType: 'CustomUser' },
 *     createUser: { skip: true },
 *   },
 * })
 * ```
 */
export function vueQueryV4(config?: VueQueryV4Config): Plugin {
  return {
    id: 'vue-query-v4',
    name: 'Vue Query v4',
    version: '1.0.0',

    emit(ctx) {
      const resolvedConfig = resolveConfig(config);
      const typeImports = new Set<string>();
      const sections: string[] = [];

      // Process each endpoint
      for (const endpoint of ctx.ast.endpoints) {
        const operationId = endpoint.operationId ?? endpoint.id;
        const override = resolvedConfig.overrides[operationId];

        if (override?.skip) continue;

        const isQuery = shouldGenerateQuery(endpoint, override, resolvedConfig, ctx.utils);
        const isMutation = shouldGenerateMutation(endpoint, override, resolvedConfig, ctx.utils);

        if (isQuery) {
          sections.push(generateQueryCode(endpoint, resolvedConfig, ctx.utils, typeImports));
        }

        if (isMutation) {
          sections.push(generateMutationCode(endpoint, resolvedConfig, ctx.utils, typeImports));
        }
      }

      // Build final output with imports at top
      const imports = generateImports(resolvedConfig, typeImports);
      const content = [
        '// Generated by schema-gen - DO NOT EDIT\n',
        imports,
        sections.join('\n'),
      ].join('\n');

      return [
        {
          path: resolvedConfig.fileName,
          content: content.trimEnd() + '\n',
        },
      ];
    },
  };
}

// Default export for convenient usage
export default vueQueryV4;

// ============================================================================
// Configuration
// ============================================================================

function resolveConfig(config: VueQueryV4Config = {}): ResolvedConfig {
  return {
    fileName: config.fileName ?? 'queries.ts',
    useQuery: config.useQuery ?? true,
    useMutation: config.useMutation ?? true,
    useInfiniteQuery: config.useInfiniteQuery ?? false,
    infiniteQueryParam: config.infiniteQueryParam ?? 'cursor',
    useSuspenseQuery: config.useSuspenseQuery ?? false,
    exportQueryKeys: config.exportQueryKeys ?? true,
    exportQueryOptions: config.exportQueryOptions ?? true,
    useOperationIdAsQueryKey: config.useOperationIdAsQueryKey ?? true,
    includeJsDoc: config.includeJsDoc ?? true,
    baseUrl: config.baseUrl ?? '',
    typesImportPath: config.typesImportPath ?? './types',
    customFetch: config.customFetch,
    overrides: config.overrides ?? {},
  };
}

// ============================================================================
// Query/Mutation Classification
// ============================================================================

function shouldGenerateQuery(
  endpoint: EndpointNode,
  override: OperationOverride | undefined,
  config: ResolvedConfig,
  utils: { isQuery: (e: EndpointNode) => boolean },
): boolean {
  if (override?.forceQuery) return true;
  if (override?.forceMutation) return false;
  return config.useQuery && utils.isQuery(endpoint);
}

function shouldGenerateMutation(
  endpoint: EndpointNode,
  override: OperationOverride | undefined,
  config: ResolvedConfig,
  utils: { isMutation: (e: EndpointNode) => boolean },
): boolean {
  if (override?.forceMutation) return true;
  if (override?.forceQuery) return false;
  return config.useMutation && utils.isMutation(endpoint);
}

// ============================================================================
// Import Generation
// ============================================================================

function generateImports(config: ResolvedConfig, typeImports: Set<string>): string {
  const lines: string[] = [];

  // Vue Query imports
  const vueQueryTypes: string[] = [];
  const vueQueryValues: string[] = [];

  if (config.useQuery) {
    vueQueryTypes.push('UseQueryOptions', 'UseQueryReturnType');
    vueQueryValues.push('useQuery');
  }

  if (config.useMutation) {
    vueQueryTypes.push('UseMutationOptions', 'UseMutationReturnType');
    vueQueryValues.push('useMutation');
  }

  if (config.useInfiniteQuery) {
    vueQueryTypes.push('UseInfiniteQueryOptions', 'UseInfiniteQueryReturnType');
    vueQueryValues.push('useInfiniteQuery');
  }

  if (config.useSuspenseQuery) {
    vueQueryTypes.push('UseSuspenseQueryOptions', 'UseSuspenseQueryReturnType');
    vueQueryValues.push('useSuspenseQuery');
  }

  if (vueQueryTypes.length > 0) {
    lines.push(`import type { ${vueQueryTypes.join(', ')} } from '@tanstack/vue-query';`);
  }

  if (vueQueryValues.length > 0) {
    lines.push(`import { ${vueQueryValues.join(', ')} } from '@tanstack/vue-query';`);
  }

  // Vue imports
  lines.push(`import type { MaybeRef } from 'vue';`);
  lines.push(`import { computed, unref } from 'vue';`);

  // Custom fetch import
  if (config.customFetch) {
    lines.push(`import { ${config.customFetch.name} } from '${config.customFetch.from}';`);
  }

  // Type imports from generated types
  if (typeImports.size > 0) {
    const sortedTypes = Array.from(typeImports).sort();
    lines.push(`import type { ${sortedTypes.join(', ')} } from '${config.typesImportPath}';`);
  }

  return lines.join('\n') + '\n';
}

// ============================================================================
// Query Code Generation
// ============================================================================

function generateQueryCode(
  endpoint: EndpointNode,
  config: ResolvedConfig,
  utils: { toPascalCase: (s: string) => string; toCamelCase: (s: string) => string },
  typeImports: Set<string>,
): string {
  const operationId = endpoint.operationId ?? endpoint.id;
  const override = config.overrides[operationId];

  const baseName = getOperationName(endpoint, utils);
  const pascalName = utils.toPascalCase(baseName);
  const camelName = utils.toCamelCase(baseName);

  const params = getEndpointParams(endpoint);
  const hasParams = params.length > 0;

  const responseType = override?.responseType ?? getResponseType(endpoint, typeImports);
  const errorType = override?.errorType ?? 'Error';
  const paramsTypeName = override?.paramsType ?? `${pascalName}Params`;

  const sections: string[] = [];

  // Section header
  sections.push(`\n// ============ ${endpoint.method} ${endpoint.path} ============\n`);

  // Generate params interface
  if (hasParams && !override?.paramsType) {
    sections.push(generateParamsInterface(paramsTypeName, params));
  }

  // Generate query key function
  if (config.exportQueryKeys) {
    sections.push(generateQueryKeyFn(camelName, pascalName, paramsTypeName, hasParams, params));
  }

  // Generate query options function
  if (config.exportQueryOptions) {
    sections.push(
      generateQueryOptionsFn(
        endpoint,
        camelName,
        pascalName,
        paramsTypeName,
        hasParams,
        responseType,
        errorType,
        config,
      ),
    );
  }

  // Generate useQuery hook
  sections.push(
    generateUseQueryHook(
      endpoint,
      camelName,
      pascalName,
      paramsTypeName,
      hasParams,
      responseType,
      errorType,
      config,
    ),
  );

  return sections.join('\n');
}

function generateParamsInterface(typeName: string, params: ParameterNode[]): string {
  const props = params.map((p) => {
    const optional = p.required ? '' : '?';
    const tsType = typeRefToTypeScript(p.typeRef);
    return `  ${p.name}${optional}: ${tsType};`;
  });

  return `export interface ${typeName} {\n${props.join('\n')}\n}\n`;
}

function generateQueryKeyFn(
  camelName: string,
  pascalName: string,
  paramsTypeName: string,
  hasParams: boolean,
  params: ParameterNode[],
): string {
  const fnName = `get${pascalName}QueryKey`;

  if (!hasParams) {
    return `export const ${fnName} = () => ['${camelName}'] as const;\n\nexport type ${pascalName}QueryKey = ReturnType<typeof ${fnName}>;\n`;
  }

  // Build query key array with params
  const keyParts = params.map((p) => `params.${p.name}`).join(', ');

  return `export const ${fnName} = (params: ${paramsTypeName}) =>
  ['${camelName}', ${keyParts}] as const;

export type ${pascalName}QueryKey = ReturnType<typeof ${fnName}>;\n`;
}

function generateQueryOptionsFn(
  endpoint: EndpointNode,
  camelName: string,
  pascalName: string,
  paramsTypeName: string,
  hasParams: boolean,
  responseType: string,
  errorType: string,
  config: ResolvedConfig,
): string {
  const fnName = `get${pascalName}QueryOptions`;
  const keyFnName = `get${pascalName}QueryKey`;
  const fetchCall = buildFetchCall(endpoint, config, hasParams);

  if (!hasParams) {
    return `export const ${fnName} = <TData = ${responseType}, TError = ${errorType}>(
  options?: Partial<UseQueryOptions<${responseType}, TError, TData>>
) => ({
  queryKey: ${keyFnName}(),
  queryFn: () => ${fetchCall},
  ...options,
});\n`;
  }

  return `export const ${fnName} = <TData = ${responseType}, TError = ${errorType}>(
  params: MaybeRef<${paramsTypeName}>,
  options?: Partial<UseQueryOptions<${responseType}, TError, TData>>
) => ({
  queryKey: computed(() => ${keyFnName}(unref(params))),
  queryFn: () => ${fetchCall},
  ...options,
});\n`;
}

function generateUseQueryHook(
  endpoint: EndpointNode,
  camelName: string,
  pascalName: string,
  paramsTypeName: string,
  hasParams: boolean,
  responseType: string,
  errorType: string,
  config: ResolvedConfig,
): string {
  const hookName = `use${pascalName}`;
  const optionsFnName = `get${pascalName}QueryOptions`;

  let jsDoc = '';
  if (config.includeJsDoc) {
    const description = endpoint.summary || endpoint.description || '';
    jsDoc = `/**
 * ${description}
 * @path ${endpoint.method} ${endpoint.path}
 */\n`;
  }

  if (!hasParams) {
    return `${jsDoc}export const ${hookName} = <TData = ${responseType}, TError = ${errorType}>(
  options?: Partial<UseQueryOptions<${responseType}, TError, TData>>
): UseQueryReturnType<TData, TError> => {
  return useQuery(${optionsFnName}(options));
};\n`;
  }

  return `${jsDoc}export const ${hookName} = <TData = ${responseType}, TError = ${errorType}>(
  params: MaybeRef<${paramsTypeName}>,
  options?: Partial<UseQueryOptions<${responseType}, TError, TData>>
): UseQueryReturnType<TData, TError> => {
  return useQuery(${optionsFnName}(params, options));
};\n`;
}

// ============================================================================
// Mutation Code Generation
// ============================================================================

function generateMutationCode(
  endpoint: EndpointNode,
  config: ResolvedConfig,
  utils: { toPascalCase: (s: string) => string; toCamelCase: (s: string) => string },
  typeImports: Set<string>,
): string {
  const operationId = endpoint.operationId ?? endpoint.id;
  const override = config.overrides[operationId];

  const baseName = getOperationName(endpoint, utils);
  const pascalName = utils.toPascalCase(baseName);

  const responseType = override?.responseType ?? getResponseType(endpoint, typeImports);
  const errorType = override?.errorType ?? 'Error';
  const bodyType = override?.requestBodyType ?? getRequestBodyType(endpoint, typeImports);
  const pathParams = (endpoint.parameters ?? []).filter((p) => p.location === 'path');

  const sections: string[] = [];

  // Section header
  sections.push(`\n// ============ ${endpoint.method} ${endpoint.path} ============\n`);

  // Generate mutation variables type if needed
  const varsTypeName = `${pascalName}Variables`;
  const hasPathParams = pathParams.length > 0;
  const hasBody = bodyType !== 'void';

  if (hasPathParams || hasBody) {
    sections.push(generateMutationVariablesType(varsTypeName, pathParams, bodyType, hasBody));
  }

  // Generate useMutation hook
  sections.push(
    generateUseMutationHook(
      endpoint,
      pascalName,
      varsTypeName,
      responseType,
      errorType,
      bodyType,
      hasPathParams,
      hasBody,
      pathParams,
      config,
    ),
  );

  return sections.join('\n');
}

function generateMutationVariablesType(
  typeName: string,
  pathParams: ParameterNode[],
  bodyType: string,
  hasBody: boolean,
): string {
  const props: string[] = [];

  for (const param of pathParams) {
    const tsType = typeRefToTypeScript(param.typeRef);
    props.push(`  ${param.name}: ${tsType};`);
  }

  if (hasBody) {
    props.push(`  data: ${bodyType};`);
  }

  return `export interface ${typeName} {\n${props.join('\n')}\n}\n`;
}

function generateUseMutationHook(
  endpoint: EndpointNode,
  pascalName: string,
  varsTypeName: string,
  responseType: string,
  errorType: string,
  bodyType: string,
  hasPathParams: boolean,
  hasBody: boolean,
  pathParams: ParameterNode[],
  config: ResolvedConfig,
): string {
  const hookName = `use${pascalName}`;

  // Build the mutation function
  const mutationFn = buildMutationFn(
    endpoint,
    bodyType,
    hasPathParams,
    hasBody,
    pathParams,
    config,
  );

  let jsDoc = '';
  if (config.includeJsDoc) {
    const description = endpoint.summary || endpoint.description || '';
    jsDoc = `/**
 * ${description}
 * @path ${endpoint.method} ${endpoint.path}
 */\n`;
  }

  // Determine the variables type
  const varsType = hasPathParams || hasBody ? varsTypeName : 'void';

  return `${jsDoc}export const ${hookName} = <TError = ${errorType}, TContext = unknown>(
  options?: Partial<UseMutationOptions<${responseType}, TError, ${varsType}, TContext>>
): UseMutationReturnType<${responseType}, TError, ${varsType}, TContext> => {
  return useMutation({
    mutationFn: ${mutationFn},
    ...options,
  });
};\n`;
}

function buildMutationFn(
  endpoint: EndpointNode,
  bodyType: string,
  hasPathParams: boolean,
  hasBody: boolean,
  pathParams: ParameterNode[],
  config: ResolvedConfig,
): string {
  const baseUrl = config.baseUrl;
  const method = endpoint.method;

  // Build path - interpolate path params from vars if present
  let path: string;
  if (hasPathParams) {
    let pathTemplate = endpoint.path;
    for (const param of pathParams) {
      pathTemplate = pathTemplate.replace(
        new RegExp(`\\{${param.name}\\}`, 'g'),
        `\${vars.${param.name}}`,
      );
    }
    path = `\`${baseUrl}${pathTemplate}\``;
  } else {
    path = `'${baseUrl}${endpoint.path}'`;
  }

  // Determine parameter name based on what we have
  const hasVars = hasPathParams || hasBody;
  const varsParam = hasVars ? 'vars' : '';

  if (config.customFetch) {
    const fetchName = config.customFetch.name;
    if (hasBody) {
      return `(${varsParam}) => ${fetchName}(${path}, { method: '${method}', body: vars.data })`;
    }
    if (hasPathParams) {
      return `(${varsParam}) => ${fetchName}(${path}, { method: '${method}' })`;
    }
    return `() => ${fetchName}(${path}, { method: '${method}' })`;
  }

  // Native fetch
  if (hasBody) {
    return `(${varsParam}) => fetch(${path}, {
      method: '${method}',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(vars.data),
    }).then(res => res.json())`;
  }

  if (hasPathParams) {
    return `(${varsParam}) => fetch(${path}, { method: '${method}' }).then(res => res.json())`;
  }

  return `() => fetch(${path}, { method: '${method}' }).then(res => res.json())`;
}

// ============================================================================
// Helper Functions
// ============================================================================

function getOperationName(
  endpoint: EndpointNode,
  utils: { toCamelCase: (s: string) => string },
): string {
  if (endpoint.operationId) {
    return utils.toCamelCase(endpoint.operationId);
  }

  // Generate from method + path
  const pathParts = endpoint.path
    .split('/')
    .filter((p) => p && !p.startsWith('{'))
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase());

  return endpoint.method.toLowerCase() + pathParts.join('');
}

function getEndpointParams(endpoint: EndpointNode): ParameterNode[] {
  return (endpoint.parameters ?? []).filter((p) => p.location === 'path' || p.location === 'query');
}

function getResponseType(endpoint: EndpointNode, typeImports: Set<string>): string {
  const responses = endpoint.responses ?? [];
  if (responses.length === 0) return 'unknown';

  // Find 2xx response
  const successResponse = responses.find((r) => {
    if (typeof r.statusCode === 'object' && 'code' in r.statusCode) {
      return r.statusCode.code >= 200 && r.statusCode.code < 300;
    }
    return r.statusCode === 'range2xx' || r.statusCode === 'default';
  });

  if (!successResponse) return 'unknown';

  // Find application/json content
  const content = successResponse.content ?? [];
  const jsonContent = content.find((c) => c.mediaType === 'application/json');

  if (!jsonContent?.typeRef) return 'unknown';

  return extractTypeName(jsonContent.typeRef, typeImports);
}

function getRequestBodyType(endpoint: EndpointNode, typeImports: Set<string>): string {
  if (!endpoint.requestBody) return 'void';

  const content = endpoint.requestBody.content ?? [];
  const jsonContent = content.find((c) => c.mediaType === 'application/json');

  if (!jsonContent?.typeRef) return 'unknown';

  return extractTypeName(jsonContent.typeRef, typeImports);
}

function extractTypeName(typeRef: TypeRef, typeImports: Set<string>): string {
  switch (typeRef.kind) {
    case 'named':
      typeImports.add(typeRef.name);
      return typeRef.name;
    case 'enum':
      typeImports.add(typeRef.name);
      return typeRef.name;
    case 'array':
      return `${extractTypeName(typeRef.items, typeImports)}[]`;
    case 'primitive':
      if ('primitiveType' in typeRef) {
        switch (typeRef.primitiveType) {
          case 'string':
            return 'string';
          case 'number':
          case 'integer':
            return 'number';
          case 'boolean':
            return 'boolean';
          case 'null':
            return 'null';
          default:
            return 'unknown';
        }
      }
      return 'unknown';
    default:
      return 'unknown';
  }
}

function typeRefToTypeScript(typeRef: TypeRef): string {
  switch (typeRef.kind) {
    case 'named':
      return typeRef.name;
    case 'enum':
      return typeRef.name;
    case 'array':
      return `${typeRefToTypeScript(typeRef.items)}[]`;
    case 'primitive':
      if ('primitiveType' in typeRef) {
        switch (typeRef.primitiveType) {
          case 'string':
            return 'string';
          case 'number':
          case 'integer':
            return 'number';
          case 'boolean':
            return 'boolean';
          default:
            return 'string';
        }
      }
      return 'string';
    default:
      return 'string';
  }
}

function buildFetchCall(
  endpoint: EndpointNode,
  config: ResolvedConfig,
  hasParams: boolean,
): string {
  const allParams = endpoint.parameters ?? [];
  const pathParams = allParams.filter((p) => p.location === 'path');
  const queryParams = allParams.filter((p) => p.location === 'query');

  const baseUrl = config.baseUrl;
  let path = endpoint.path;

  // Build path with interpolated path params
  const hasPathParams = pathParams.length > 0;
  if (hasPathParams) {
    for (const param of pathParams) {
      path = path.replace(new RegExp(`\\{${param.name}\\}`, 'g'), `\${p.${param.name}}`);
    }
  }

  // Generate the fetch call with query string building
  const hasQueryParams = queryParams.length > 0;
  const needsTemplate = hasPathParams || hasQueryParams;

  if (!needsTemplate && !hasQueryParams) {
    // Simple static path
    if (config.customFetch) {
      return `${config.customFetch.name}('${baseUrl}${path}')`;
    }
    return `fetch('${baseUrl}${path}').then(res => res.json())`;
  }

  // We need to build the URL with query params
  // Generate a function body that builds the URL
  const lines: string[] = [];
  lines.push(`(() => {`);
  lines.push(`      const p = unref(params);`);

  if (hasQueryParams) {
    lines.push(`      const searchParams = new URLSearchParams();`);
    for (const param of queryParams) {
      lines.push(
        `      if (p.${param.name} !== undefined) searchParams.append('${param.name}', String(p.${param.name}));`,
      );
    }
    lines.push(`      const query = searchParams.toString();`);
    lines.push(`      const url = \`${baseUrl}${path}\${query ? \`?\${query}\` : ''}\`;`);
  } else {
    lines.push(`      const url = \`${baseUrl}${path}\`;`);
  }

  if (config.customFetch) {
    lines.push(`      return ${config.customFetch.name}(url);`);
  } else {
    lines.push(`      return fetch(url).then(res => res.json());`);
  }
  lines.push(`    })()`);

  return lines.join('\n');
}
