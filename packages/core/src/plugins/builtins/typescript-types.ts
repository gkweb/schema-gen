/**
 * Built-in TypeScript types plugin
 *
 * Generates TypeScript type definitions from the AST using the Rust generator.
 */

import type { Plugin } from '@schema-gen/plugin-sdk';

const typescriptTypes: Plugin = {
  id: 'typescript-types',
  name: 'TypeScript Types',
  version: '1.0.0',

  emit(ctx) {
    return ctx.binding.generateTypes(ctx.ast, ctx.config);
  },
};

export default typescriptTypes;
