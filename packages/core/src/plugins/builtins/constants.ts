/**
 * Built-in constants plugin
 *
 * Generates constant definitions from the AST using the Rust generator.
 */

import type { Plugin } from '@schema-gen/plugin-sdk';

const constants: Plugin = {
	id: 'constants',
	name: 'Constants',
	version: '1.0.0',

	emit(ctx) {
		return ctx.binding.generateConstants(ctx.ast, ctx.config);
	},
};

export default constants;
