/**
 * @schema-gen/core
 *
 * High-performance OpenAPI to TypeScript/React Query/Vue Query code generation.
 *
 * @example
 * ```typescript
 * import { generate, parseSpec } from '@schema-gen/core';
 *
 * const spec = fs.readFileSync('openapi.yaml', 'utf-8');
 * const ast = parseSpec(spec);
 * const files = generate(ast, ['typescript-types', 'react-query']);
 * ```
 */

export * from './binding';
export * from './config';
export * from './types';
export * from './plugins';
export { createGenerator } from './generator';
export type { Generator, CreateGeneratorOptions } from './generator';
