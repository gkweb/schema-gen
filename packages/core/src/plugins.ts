/**
 * Typed plugin configuration helpers
 *
 * These helpers provide type-safe configuration for built-in plugins.
 *
 * @example
 * ```typescript
 * import { defineConfig, plugins } from '@schema-gen/core';
 *
 * export default defineConfig({
 *   input: { path: './openapi.yaml' },
 *   output: { dir: './src/api' },
 *   plugins: [
 *     plugins.typescriptTypes({ preferInterfaces: true }),
 *     plugins.typescriptEnums({ enumStyle: 'union' }),
 *     plugins.requestPaths({ suffix: 'Url' }),
 *   ],
 * });
 * ```
 *
 * For Vue Query support, install @schema-gen/plugin-vue-query-v4:
 * ```typescript
 * import vueQueryV4 from '@schema-gen/plugin-vue-query-v4';
 *
 * export default defineConfig({
 *   plugins: [
 *     vueQueryV4({ typesImportPath: './api-types' }),
 *   ],
 * });
 * ```
 */

import type { PluginConfig } from './config';

/**
 * TypeScript types plugin configuration
 */
export interface TypeScriptTypesConfig {
  /**
   * Use `interface` instead of `type` for object types
   * @default false
   */
  preferInterfaces?: boolean;

  /**
   * Add `readonly` modifier to all properties
   * @default false
   */
  readonlyProperties?: boolean;

  /**
   * Generate JSDoc comments from descriptions
   * @default true
   */
  generateJsdoc?: boolean;

  /**
   * Export style for generated types
   * @default 'named'
   */
  exportStyle?: 'named' | 'default';

  /**
   * Output file name
   * @default 'types.ts'
   */
  fileName?: string;
}

/**
 * TypeScript enums plugin configuration
 */
export interface TypeScriptEnumsConfig {
  /**
   * Enum generation style
   * - 'enum': Standard TypeScript enum
   * - 'const-enum': Const enum (inlined at compile time)
   * - 'union': Union type with values object
   * @default 'enum'
   */
  enumStyle?: 'enum' | 'const-enum' | 'union';

  /**
   * Generate JSDoc comments from descriptions
   * @default true
   */
  generateJsdoc?: boolean;

  /**
   * Output file name
   * @default 'enums.ts'
   */
  fileName?: string;
}

/**
 * Constants plugin configuration
 */
export interface ConstantsConfig {
  /**
   * Output file name
   * @default 'constants.ts'
   */
  fileName?: string;
}

/**
 * Request paths plugin configuration
 */
export interface RequestPathsConfig {
  /**
   * Suffix to append to function names
   * @default 'Path'
   */
  suffix?: string;

  /**
   * Output file name
   * @default 'paths.ts'
   */
  fileName?: string;

  /**
   * Include JSDoc comments with endpoint description
   * @default true
   */
  includeJsDoc?: boolean;
}

/**
 * Create a typed plugin configuration
 */
function createPluginConfig<T extends Record<string, unknown>>(
  name: string,
  config?: T,
): PluginConfig {
  if (!config || Object.keys(config).length === 0) {
    return name;
  }
  return { name, config };
}

/**
 * TypeScript types plugin
 *
 * Generates TypeScript type definitions from OpenAPI schemas.
 *
 * @example
 * ```typescript
 * plugins.typescriptTypes()
 * plugins.typescriptTypes({ preferInterfaces: true, readonlyProperties: true })
 * ```
 */
export function typescriptTypes(config?: TypeScriptTypesConfig): PluginConfig {
  return createPluginConfig('typescript-types', config);
}

/**
 * TypeScript enums plugin
 *
 * Generates TypeScript enums from OpenAPI enums.
 *
 * @example
 * ```typescript
 * plugins.typescriptEnums()
 * plugins.typescriptEnums({ enumStyle: 'union' })
 * ```
 */
export function typescriptEnums(config?: TypeScriptEnumsConfig): PluginConfig {
  return createPluginConfig('typescript-enums', config);
}

/**
 * Constants plugin
 *
 * Generates endpoint path and method constants.
 *
 * @example
 * ```typescript
 * plugins.constants()
 * plugins.constants({ fileName: 'api-constants.ts' })
 * ```
 */
export function constants(config?: ConstantsConfig): PluginConfig {
  return createPluginConfig('constants', config);
}

/**
 * Request paths plugin
 *
 * Generates typed path builder functions for each endpoint.
 * Functions are individually exported for tree-shaking.
 *
 * @example
 * ```typescript
 * plugins.requestPaths()
 * plugins.requestPaths({ suffix: 'Url', includeJsDoc: false })
 * ```
 */
export function requestPaths(config?: RequestPathsConfig): PluginConfig {
  return createPluginConfig('request-paths', config);
}

/**
 * All built-in plugin helpers
 */
export const plugins = {
  typescriptTypes,
  typescriptEnums,
  constants,
  requestPaths,
} as const;
