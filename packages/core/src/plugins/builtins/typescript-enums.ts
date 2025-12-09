/**
 * Built-in TypeScript enums plugin
 *
 * Generates TypeScript enum definitions from the AST using the Rust generator.
 */

import type { Plugin } from '@schema-gen/plugin-sdk';

const typescriptEnums: Plugin = {
	id: 'typescript-enums',
	name: 'TypeScript Enums',
	version: '1.0.0',

	emit(ctx) {
		return ctx.binding.generateEnums(ctx.ast, ctx.config);
	},
};

export default typescriptEnums;
