/**
 * React Query v5 Plugin for schema-gen
 *
 * Generates TanStack React Query v5 hooks from OpenAPI specifications.
 * Produces useQuery hooks for GET endpoints and useMutation hooks for mutations.
 *
 * @example
 * ```typescript
 * import { defineConfig } from '@schema-gen/core';
 * import reactQueryV5 from '@schema-gen/plugin-react-query-v5';
 *
 * export default defineConfig({
 *   input: { path: './openapi.yaml' },
 *   output: { dir: './src/api' },
 *   plugins: [
 *     reactQueryV5(),
 *     // or with config:
 *     reactQueryV5({ typesImportPath: './api-types' }),
 *   ],
 * });
 * ```
 */

import type {
  Plugin,
  EndpointNode,
  ParameterNode,
  TypeRef,
  GeneratedFile,
  Logger,
  OutputStructure,
  PluginUtils,
} from '@schema-gen/plugin-sdk';

// ============================================================================
// Configuration Types
// ============================================================================

/**
 * React Query v5 plugin configuration
 */
export interface ReactQueryV5Config {
  /**
   * Output file name
   * @default 'hooks.ts'
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
   * Import path for generated enums (if separate from types)
   * @default undefined (imports from typesImportPath)
   */
  enumsImportPath?: string;

  /**
   * Custom fetch function import. If not provided, uses native fetch.
   * @example { from: './api-client', name: 'apiClient' }
   */
  fetchFn?: {
    from: string;
    name: string;
  };

  /**
   * FormData builder for multipart/form-data endpoints.
   * If not provided, endpoints with multipart/form-data will emit a warning.
   * @example { from: './lib/form-data', name: 'toFormData' }
   */
  formDataFn?: {
    from: string;
    name: string;
  };

  /**
   * Wrap every emitted `useQuery` options object through a user-supplied
   * function before passing it to React Query.
   *
   * The function is invoked with `(options, opContext)` where
   * `opContext = { operationId, method, path }`. Equivalent to orval's
   * `output.override.query.queryOptions`.
   *
   * @example { from: './api/query-options', name: 'queryOptions' }
   */
  queryOptions?: {
    from: string;
    name: string;
  };

  /**
   * Wrap every emitted `useMutation` options object through a user-supplied
   * function before passing it to React Query. Same calling convention as
   * `queryOptions`. Equivalent to orval's
   * `output.override.query.mutationOptions`.
   *
   * @example { from: './api/mutation-options', name: 'mutationOptions' }
   */
  mutationOptions?: {
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

  /**
   * Override FormData handling for this endpoint.
   * Set to false to force JSON even if spec says form-data.
   * Or provide a custom builder to override the plugin-level formDataFn.
   */
  formDataFn?: { from: string; name: string } | false;

  /**
   * Override the HTTP fetch function for this endpoint.
   * Set to `false` to force native `fetch` even if a global `fetchFn` is set.
   * Or provide a different `{ from, name }` to swap the import per-op.
   *
   * Equivalent to setting `output.override.operations.<opId>.mutator` in orval.
   */
  fetchFn?: { from: string; name: string } | false;

  /**
   * Override the `useQuery` options wrapper for this endpoint.
   * Falls back to the plugin-level `queryOptions` when not set.
   *
   * Plugin-level + per-op are independent: setting only per-op leaves
   * other operations using the plugin-level wrapper (or none).
   */
  queryOptions?: { from: string; name: string };

  /**
   * Override the `useMutation` options wrapper for this endpoint.
   * Falls back to the plugin-level `mutationOptions` when not set.
   */
  mutationOptions?: { from: string; name: string };
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
  enumsImportPath?: string;
  fetchFn?: { from: string; name: string };
  formDataFn?: { from: string; name: string };
  queryOptions?: { from: string; name: string };
  mutationOptions?: { from: string; name: string };
  overrides: Record<string, OperationOverride>;
}

// ============================================================================
// Plugin Factory
// ============================================================================

/**
 * Create a React Query v5 plugin instance
 *
 * @param config - Plugin configuration options
 * @returns Configured plugin instance
 *
 * @example
 * ```typescript
 * // Basic usage
 * reactQueryV5()
 *
 * // With custom types import
 * reactQueryV5({ typesImportPath: './api-types' })
 *
 * // With custom fetch client
 * reactQueryV5({
 *   fetchFn: { from: './api-client', name: 'apiClient' },
 * })
 *
 * // With operation overrides
 * reactQueryV5({
 *   overrides: {
 *     getUser: { responseType: 'CustomUser' },
 *     createUser: { skip: true },
 *   },
 * })
 * ```
 */
export function reactQueryV5(config?: ReactQueryV5Config): Plugin {
  return {
    id: 'react-query-v5',
    name: 'React Query v5',
    version: '1.0.0',

    emit(ctx) {
      const resolvedConfig = resolveConfig(config);
      const knownEnums = new Set(Object.keys(ctx.ast.enums));

      const groups = groupEndpointsForStructure(
        ctx.ast.endpoints,
        ctx.outputStructure,
        resolvedConfig,
        ctx.utils,
      );

      return groups.map(({ fileName, endpoints }) =>
        renderGroup(fileName, endpoints, resolvedConfig, ctx.utils, knownEnums, ctx.log),
      );
    },
  };
}

// Default export for convenient usage
export default reactQueryV5;

// ============================================================================
// Configuration
// ============================================================================

function resolveConfig(config: ReactQueryV5Config = {}): ResolvedConfig {
  return {
    fileName: config.fileName ?? 'hooks.ts',
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
    enumsImportPath: config.enumsImportPath,
    fetchFn: config.fetchFn,
    formDataFn: config.formDataFn,
    queryOptions: config.queryOptions,
    mutationOptions: config.mutationOptions,
    overrides: config.overrides ?? {},
  };
}

// ============================================================================
// Output structure grouping
// ============================================================================

interface EndpointGroup {
  fileName: string;
  endpoints: EndpointNode[];
}

/**
 * Bucket endpoints into the output files dictated by `output.structure`.
 *
 * - `flat` (default) — every endpoint into a single file (`fileName`).
 * - `by-tag` — one file per first-tag (kebab-cased), `default.ts` for untagged.
 * - `by-endpoint` — one file per generated operation (kebab-cased operationId).
 *
 * Endpoints whose overrides set `skip` are dropped before grouping so we
 * don't emit stray empty files in `by-endpoint` mode.
 */
function groupEndpointsForStructure(
  allEndpoints: readonly EndpointNode[],
  structure: OutputStructure,
  config: ResolvedConfig,
  utils: PluginUtils,
): EndpointGroup[] {
  const eligible = allEndpoints.filter((endpoint) => {
    const operationId = endpoint.operationId ?? endpoint.id;
    const override = config.overrides[operationId];
    if (override?.skip) return false;
    return (
      shouldGenerateQuery(endpoint, override, config, utils) ||
      shouldGenerateMutation(endpoint, override, config, utils)
    );
  });

  if (structure === 'by-endpoint') {
    return eligible.map((endpoint) => ({
      fileName: `${utils.toKebabCase(endpoint.operationId ?? endpoint.id)}.ts`,
      endpoints: [endpoint],
    }));
  }

  if (structure === 'by-tag') {
    const groups = new Map<string, EndpointNode[]>();
    for (const endpoint of eligible) {
      const tag = endpoint.tags[0] ?? 'default';
      const key = utils.toKebabCase(tag);
      const bucket = groups.get(key) ?? [];
      bucket.push(endpoint);
      groups.set(key, bucket);
    }
    return Array.from(groups, ([key, endpoints]) => ({
      fileName: `${key}.ts`,
      endpoints,
    }));
  }

  // 'flat' (default)
  return [{ fileName: config.fileName, endpoints: eligible }];
}

/**
 * Render one output file from a list of endpoints. Each call produces an
 * independent module (its own imports), so plugins can emit several modules
 * without import bleed-through.
 */
function renderGroup(
  fileName: string,
  endpoints: readonly EndpointNode[],
  config: ResolvedConfig,
  utils: PluginUtils,
  knownEnums: Set<string>,
  log: Logger,
): GeneratedFile {
  const typeImports = new Set<string>();
  const enumImports = new Set<string>();
  const formDataImports = new Map<string, { from: string; name: string }>();
  // Holds fetchFn / queryOptions / mutationOptions imports actually
  // referenced by the rendered code — populated during emission.
  const extraImports = new Map<string, { from: string; name: string }>();
  const sections: string[] = [];

  for (const endpoint of endpoints) {
    const operationId = endpoint.operationId ?? endpoint.id;
    const override = config.overrides[operationId];

    const isQuery = shouldGenerateQuery(endpoint, override, config, utils);
    const isMutation = shouldGenerateMutation(endpoint, override, config, utils);

    if (isQuery) {
      sections.push(
        generateQueryCode(endpoint, config, utils, typeImports, enumImports, knownEnums, extraImports),
      );
    }
    if (isMutation) {
      sections.push(
        generateMutationCode(
          endpoint,
          config,
          utils,
          typeImports,
          enumImports,
          knownEnums,
          formDataImports,
          extraImports,
          log,
        ),
      );
    }
  }

  const imports = generateImports(config, typeImports, enumImports, formDataImports, extraImports);
  const content = [
    '// Generated by schema-gen - DO NOT EDIT\n',
    imports,
    sections.join('\n'),
  ].join('\n');

  return {
    path: fileName,
    content: content.trimEnd() + '\n',
  };
}

/**
 * Resolve effective per-op overrides for fetch / query / mutation wrappers.
 * The order is: per-op override beats plugin-level config; `false` on
 * fetchFn explicitly forces the native `fetch` path.
 */
function resolveEffectiveOverrides(
  override: OperationOverride | undefined,
  config: ResolvedConfig,
): {
  fetchFn?: { from: string; name: string };
  queryOptions?: { from: string; name: string };
  mutationOptions?: { from: string; name: string };
} {
  const fetchFn =
    override?.fetchFn === false
      ? undefined
      : (override?.fetchFn ?? config.fetchFn);
  const queryOptions = override?.queryOptions ?? config.queryOptions;
  const mutationOptions = override?.mutationOptions ?? config.mutationOptions;

  return { fetchFn, queryOptions, mutationOptions };
}

/** Record an import for `${spec.from}` of `${spec.name}` if not already tracked. */
function recordImport(
  extraImports: Map<string, { from: string; name: string }>,
  spec: { from: string; name: string } | undefined,
): void {
  if (!spec) return;
  extraImports.set(`${spec.from}|${spec.name}`, spec);
}

/** Build a `{ operationId, method, path }` literal for opContext threading. */
function buildOpContextLiteral(endpoint: EndpointNode): string {
  const operationId = endpoint.operationId ?? endpoint.id;
  return `{ operationId: '${operationId}', method: '${endpoint.method}', path: '${endpoint.path}' }`;
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

function generateImports(
  config: ResolvedConfig,
  typeImports: Set<string>,
  enumImports: Set<string>,
  formDataImports: Map<string, { from: string; name: string }>,
  extraImports: Map<string, { from: string; name: string }>,
): string {
  const lines: string[] = [];

  // React Query imports
  const reactQueryImports: string[] = [];

  if (config.useQuery) {
    reactQueryImports.push('useQuery', 'queryOptions');
  }

  if (config.useMutation) {
    reactQueryImports.push('useMutation');
  }

  if (config.useInfiniteQuery) {
    reactQueryImports.push('useInfiniteQuery', 'infiniteQueryOptions');
  }

  if (config.useSuspenseQuery) {
    reactQueryImports.push('useSuspenseQuery');
  }

  if (reactQueryImports.length > 0) {
    lines.push(`import { ${reactQueryImports.join(', ')} } from '@tanstack/react-query';`);
  }

  // React Query types
  const reactQueryTypes: string[] = [];

  if (config.useQuery) {
    reactQueryTypes.push('UseQueryOptions', 'UseQueryResult');
  }

  if (config.useMutation) {
    reactQueryTypes.push('UseMutationOptions', 'UseMutationResult');
  }

  if (config.useInfiniteQuery) {
    reactQueryTypes.push('UseInfiniteQueryOptions', 'UseInfiniteQueryResult');
  }

  if (config.useSuspenseQuery) {
    reactQueryTypes.push('UseSuspenseQueryOptions', 'UseSuspenseQueryResult');
  }

  if (reactQueryTypes.length > 0) {
    lines.push(`import type { ${reactQueryTypes.join(', ')} } from '@tanstack/react-query';`);
  }

  // Custom imports — fetchFn, queryOptions, mutationOptions wrappers — that
  // were referenced by at least one rendered call site. Group by `from` so
  // multiple symbols from the same module collapse into a single import.
  const byModule = new Map<string, Set<string>>();
  for (const { from, name } of extraImports.values()) {
    const names = byModule.get(from) ?? new Set();
    names.add(name);
    byModule.set(from, names);
  }
  for (const [from, names] of byModule) {
    const sorted = Array.from(names).sort();
    lines.push(`import { ${sorted.join(', ')} } from '${from}';`);
  }

  // FormData builder imports
  for (const { from, name } of formDataImports.values()) {
    lines.push(`import { ${name} } from '${from}';`);
  }

  // Type imports from generated types
  if (typeImports.size > 0) {
    const sortedTypes = Array.from(typeImports).sort();
    lines.push(`import type { ${sortedTypes.join(', ')} } from '${config.typesImportPath}';`);
  }

  // Enum imports (from separate file if configured, otherwise from types)
  if (enumImports.size > 0) {
    const sortedEnums = Array.from(enumImports).sort();
    const enumPath = config.enumsImportPath ?? config.typesImportPath;
    lines.push(`import type { ${sortedEnums.join(', ')} } from '${enumPath}';`);
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
  enumImports: Set<string>,
  knownEnums: Set<string>,
  extraImports: Map<string, { from: string; name: string }>,
): string {
  const operationId = endpoint.operationId ?? endpoint.id;
  const override = config.overrides[operationId];
  const effective = resolveEffectiveOverrides(override, config);

  recordImport(extraImports, effective.fetchFn);
  recordImport(extraImports, effective.queryOptions);

  const baseName = getOperationName(endpoint, utils);
  const pascalName = utils.toPascalCase(baseName);
  const camelName = utils.toCamelCase(baseName);

  const params = getEndpointParams(endpoint);
  const hasParams = params.length > 0;

  const responseType = override?.responseType ?? getResponseType(endpoint, typeImports, enumImports, knownEnums);
  const errorType = override?.errorType ?? 'Error';
  const paramsTypeName = override?.paramsType ?? `${pascalName}Params`;

  const sections: string[] = [];

  // Section header
  sections.push(`\n// ============ ${endpoint.method} ${endpoint.path} ============\n`);

  // Generate params interface
  if (hasParams && !override?.paramsType) {
    sections.push(generateParamsInterface(paramsTypeName, params, typeImports, enumImports, knownEnums));
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
        effective.fetchFn,
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
      effective.queryOptions,
    ),
  );

  return sections.join('\n');
}

function generateParamsInterface(typeName: string, params: ParameterNode[], typeImports: Set<string>, enumImports: Set<string>, knownEnums: Set<string>): string {
  const props = params.map((p) => {
    const optional = p.required ? '' : '?';
    const tsType = typeRefToTypeScript(p.typeRef, typeImports, enumImports, knownEnums);
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
  effectiveFetchFn: { from: string; name: string } | undefined,
): string {
  const fnName = `get${pascalName}QueryOptions`;
  const keyFnName = `get${pascalName}QueryKey`;
  const fetchCall = buildFetchCall(endpoint, config, hasParams, responseType, effectiveFetchFn);

  if (!hasParams) {
    return `export const ${fnName} = <TData = ${responseType}>(
  options?: Partial<UseQueryOptions<${responseType}, ${errorType}, TData>>
) =>
  queryOptions({
    queryKey: ${keyFnName}(),
    queryFn: () => ${fetchCall},
    ...options,
  });\n`;
  }

  return `export const ${fnName} = <TData = ${responseType}>(
  params: ${paramsTypeName},
  options?: Partial<UseQueryOptions<${responseType}, ${errorType}, TData>>
) =>
  queryOptions({
    queryKey: ${keyFnName}(params),
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
  effectiveQueryOptions: { from: string; name: string } | undefined,
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

  // When a queryOptions wrapper is configured, every hook routes its
  // options object through `${wrapper}(options, opContext)` before
  // handing it to React Query.
  const wrap = (built: string): string =>
    effectiveQueryOptions
      ? `${effectiveQueryOptions.name}(${built}, ${buildOpContextLiteral(endpoint)})`
      : built;

  if (!hasParams) {
    return `${jsDoc}export const ${hookName} = <TData = ${responseType}>(
  options?: Partial<UseQueryOptions<${responseType}, ${errorType}, TData>>
): UseQueryResult<TData, ${errorType}> => {
  return useQuery(${wrap(`${optionsFnName}(options)`)});
};\n`;
  }

  return `${jsDoc}export const ${hookName} = <TData = ${responseType}>(
  params: ${paramsTypeName},
  options?: Partial<UseQueryOptions<${responseType}, ${errorType}, TData>>
): UseQueryResult<TData, ${errorType}> => {
  return useQuery(${wrap(`${optionsFnName}(params, options)`)});
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
  enumImports: Set<string>,
  knownEnums: Set<string>,
  formDataImports: Map<string, { from: string; name: string }>,
  extraImports: Map<string, { from: string; name: string }>,
  logger: { warn: (msg: string) => void },
): string {
  const operationId = endpoint.operationId ?? endpoint.id;
  const override = config.overrides[operationId];
  const effective = resolveEffectiveOverrides(override, config);

  recordImport(extraImports, effective.fetchFn);
  recordImport(extraImports, effective.mutationOptions);

  const baseName = getOperationName(endpoint, utils);
  const pascalName = utils.toPascalCase(baseName);

  const responseType = override?.responseType ?? getResponseType(endpoint, typeImports, enumImports, knownEnums);
  const errorType = override?.errorType ?? 'Error';
  const bodyType = override?.requestBodyType ?? getRequestBodyType(endpoint, typeImports, enumImports, knownEnums);
  const pathParams = (endpoint.parameters ?? []).filter((p) => p.location === 'path');

  const sections: string[] = [];

  // Section header
  sections.push(`\n// ============ ${endpoint.method} ${endpoint.path} ============\n`);

  // Generate mutation variables type if needed
  const varsTypeName = `${pascalName}Variables`;
  const hasPathParams = pathParams.length > 0;
  const hasBody = bodyType !== 'void';

  if (hasPathParams || hasBody) {
    sections.push(generateMutationVariablesType(varsTypeName, pathParams, bodyType, hasBody, typeImports, enumImports, knownEnums));
  }

  // Determine if this is a form-data endpoint and get the appropriate builder
  const isFormData = isFormDataEndpoint(endpoint);
  const formDataFnConfig = getFormDataFnConfig(endpoint, config);

  // Track formDataFn import if needed (only when it's an object config, not false or undefined)
  if (isFormData && formDataFnConfig !== false && formDataFnConfig !== undefined) {
    const key = `${formDataFnConfig.from}|${formDataFnConfig.name}`;
    formDataImports.set(key, formDataFnConfig);
  }

  // Warn if form-data endpoint has no formDataFn configured (only when undefined, not when explicitly set to false)
  if (isFormData && formDataFnConfig === undefined) {
    logger.warn(
      `[react-query-v5] Endpoint "${endpoint.operationId ?? endpoint.id}" uses multipart/form-data but no formDataFn is configured. ` +
        `Configure formDataFn in plugin options or set formDataFn: false in operation override to force JSON.`,
    );
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
      isFormData,
      formDataFnConfig,
      effective.fetchFn,
      effective.mutationOptions,
    ),
  );

  return sections.join('\n');
}

function generateMutationVariablesType(
  typeName: string,
  pathParams: ParameterNode[],
  bodyType: string,
  hasBody: boolean,
  typeImports: Set<string>,
  enumImports: Set<string>,
  knownEnums: Set<string>,
): string {
  const props: string[] = [];

  for (const param of pathParams) {
    const tsType = typeRefToTypeScript(param.typeRef, typeImports, enumImports, knownEnums);
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
  isFormData: boolean,
  formDataFnConfig: { from: string; name: string } | false | undefined,
  effectiveFetchFn: { from: string; name: string } | undefined,
  effectiveMutationOptions: { from: string; name: string } | undefined,
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
    isFormData,
    formDataFnConfig,
    responseType,
    effectiveFetchFn,
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

  // Build the options object passed to useMutation. When a mutationOptions
  // wrapper is configured, the whole object is funneled through
  // `${wrapper}(opts, opContext)` first.
  const useMutationArg = effectiveMutationOptions
    ? `${effectiveMutationOptions.name}({ mutationFn: ${mutationFn}, ...options }, ${buildOpContextLiteral(endpoint)})`
    : `{ mutationFn: ${mutationFn}, ...options }`;

  return `${jsDoc}export const ${hookName} = <TContext = unknown>(
  options?: Partial<UseMutationOptions<${responseType}, ${errorType}, ${varsType}, TContext>>
): UseMutationResult<${responseType}, ${errorType}, ${varsType}, TContext> => {
  return useMutation(${useMutationArg});
};\n`;
}

function buildMutationFn(
  endpoint: EndpointNode,
  bodyType: string,
  hasPathParams: boolean,
  hasBody: boolean,
  pathParams: ParameterNode[],
  config: ResolvedConfig,
  isFormData: boolean,
  formDataFnConfig: { from: string; name: string } | false | undefined,
  responseType: string,
  effectiveFetchFn: { from: string; name: string } | undefined,
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

  // Determine if we should use FormData (isFormData endpoint with formDataFn configured, not disabled)
  const useFormData = isFormData && formDataFnConfig !== false && formDataFnConfig !== undefined;
  const formDataFnName = useFormData ? formDataFnConfig.name : undefined;

  if (effectiveFetchFn) {
    const fetchName = effectiveFetchFn.name;
    if (hasBody) {
      if (useFormData && formDataFnName) {
        // FormData with custom fetch - pass FormData body, no Content-Type header (browser sets it with boundary)
        return `(${varsParam}) => ${fetchName}<${responseType}>(${path}, { method: '${method}', body: ${formDataFnName}(vars.data as Record<string, unknown>, { path: '${endpoint.path}', method: '${method}' }) })`;
      }
      return `(${varsParam}) => ${fetchName}<${responseType}>(${path}, { method: '${method}', body: vars.data })`;
    }
    if (hasPathParams) {
      return `(${varsParam}) => ${fetchName}<${responseType}>(${path}, { method: '${method}' })`;
    }
    return `() => ${fetchName}<${responseType}>(${path}, { method: '${method}' })`;
  }

  // Native fetch
  if (hasBody) {
    if (useFormData && formDataFnName) {
      // FormData with native fetch - no Content-Type header (browser sets it with boundary)
      return `(${varsParam}) => fetch(${path}, {
      method: '${method}',
      body: ${formDataFnName}(vars.data as Record<string, unknown>, { path: '${endpoint.path}', method: '${method}' }),
    }).then(res => res.json())`;
    }
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

function getResponseType(endpoint: EndpointNode, typeImports: Set<string>, enumImports: Set<string>, knownEnums: Set<string>): string {
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

  return extractTypeName(jsonContent.typeRef, typeImports, enumImports, knownEnums);
}

function getRequestBodyType(endpoint: EndpointNode, typeImports: Set<string>, enumImports: Set<string>, knownEnums: Set<string>): string {
  if (!endpoint.requestBody) return 'void';

  const content = endpoint.requestBody.content ?? [];

  // Check for JSON content first
  const jsonContent = content.find((c) => c.mediaType === 'application/json');
  if (jsonContent?.typeRef) {
    return extractTypeName(jsonContent.typeRef, typeImports, enumImports, knownEnums);
  }

  // Check for form-data content
  const formDataContent = content.find((c) => c.mediaType === 'multipart/form-data');
  if (formDataContent?.typeRef) {
    return extractTypeName(formDataContent.typeRef, typeImports, enumImports, knownEnums);
  }

  return 'unknown';
}

/**
 * Check if an endpoint uses multipart/form-data content type
 */
function isFormDataEndpoint(endpoint: EndpointNode): boolean {
  if (!endpoint.requestBody) return false;

  const content = endpoint.requestBody.content ?? [];
  return content.some((c) => c.mediaType === 'multipart/form-data');
}

/**
 * Get the formDataFn config for an endpoint (plugin-level or per-operation override)
 */
function getFormDataFnConfig(
  endpoint: EndpointNode,
  config: ResolvedConfig,
): { from: string; name: string } | false | undefined {
  const operationId = endpoint.operationId ?? endpoint.id;
  const override = config.overrides[operationId];

  // Per-operation override takes precedence
  if (override?.formDataFn !== undefined) {
    return override.formDataFn;
  }

  // Fall back to plugin-level config
  return config.formDataFn;
}

function extractTypeName(typeRef: TypeRef, typeImports: Set<string>, enumImports: Set<string>, knownEnums: Set<string>): string {
  switch (typeRef.kind) {
    case 'named':
      // Check if this named type is actually an enum using AST lookup
      if (knownEnums.has(typeRef.name)) {
        enumImports.add(typeRef.name);
      } else {
        typeImports.add(typeRef.name);
      }
      return typeRef.name;
    case 'enum':
      enumImports.add(typeRef.name);
      return typeRef.name;
    case 'array':
      return `${extractTypeName(typeRef.items, typeImports, enumImports, knownEnums)}[]`;
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

function typeRefToTypeScript(typeRef: TypeRef, typeImports?: Set<string>, enumImports?: Set<string>, knownEnums?: Set<string>): string {
  switch (typeRef.kind) {
    case 'named':
      // Check if this named type is actually an enum using AST lookup
      if (knownEnums?.has(typeRef.name)) {
        enumImports?.add(typeRef.name);
      } else {
        typeImports?.add(typeRef.name);
      }
      return typeRef.name;
    case 'enum':
      enumImports?.add(typeRef.name);
      return typeRef.name;
    case 'array':
      return `${typeRefToTypeScript(typeRef.items, typeImports, enumImports, knownEnums)}[]`;
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
  responseType: string,
  effectiveFetchFn: { from: string; name: string } | undefined,
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
      path = path.replace(new RegExp(`\\{${param.name}\\}`, 'g'), `\${params.${param.name}}`);
    }
  }

  // Generate the fetch call with query string building
  const hasQueryParams = queryParams.length > 0;
  const needsTemplate = hasPathParams || hasQueryParams;

  if (!needsTemplate && !hasQueryParams) {
    // Simple static path
    if (effectiveFetchFn) {
      return `${effectiveFetchFn.name}<${responseType}>('${baseUrl}${path}')`;
    }
    return `fetch('${baseUrl}${path}').then(res => res.json())`;
  }

  // We need to build the URL with query params
  // Generate a function body that builds the URL
  const lines: string[] = [];
  lines.push(`(() => {`);

  if (hasQueryParams) {
    lines.push(`      const searchParams = new URLSearchParams();`);
    for (const param of queryParams) {
      lines.push(
        `      if (params.${param.name} !== undefined) searchParams.append('${param.name}', String(params.${param.name}));`,
      );
    }
    lines.push(`      const query = searchParams.toString();`);
    lines.push(`      const url = \`${baseUrl}${path}\${query ? \`?\${query}\` : ''}\`;`);
  } else {
    lines.push(`      const url = \`${baseUrl}${path}\`;`);
  }

  if (effectiveFetchFn) {
    lines.push(`      return ${effectiveFetchFn.name}<${responseType}>(url);`);
  } else {
    lines.push(`      return fetch(url).then(res => res.json());`);
  }
  lines.push(`    })()`);

  return lines.join('\n');
}
