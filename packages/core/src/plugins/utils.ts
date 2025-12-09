/**
 * Plugin utilities
 *
 * Provides helper functions for plugins: case conversion, type resolution, etc.
 */

import type { Logger, PluginUtils } from '@schema-gen/plugin-sdk';
import type { SchemaAst, EndpointNode, TypeRef, PrimitiveType } from '../types';

/**
 * Create plugin utilities for a given AST
 */
export function createPluginUtils(ast: SchemaAst): PluginUtils {
	return {
		toPascalCase(s: string): string {
			return s
				.split(/[-_\s.]+/)
				.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
				.join('');
		},

		toCamelCase(s: string): string {
			const pascal = this.toPascalCase(s);
			return pascal.charAt(0).toLowerCase() + pascal.slice(1);
		},

		toScreamingSnakeCase(s: string): string {
			return this.toSnakeCase(s).toUpperCase();
		},

		toSnakeCase(s: string): string {
			return s
				.replace(/([A-Z])/g, '_$1')
				.toLowerCase()
				.replace(/^_/, '')
				.replace(/[-\s.]+/g, '_');
		},

		toKebabCase(s: string): string {
			return this.toSnakeCase(s).replace(/_/g, '-');
		},

		typeRefToString(ref: TypeRef): string {
			switch (ref.kind) {
				case 'named':
					return ref.name;
				case 'array':
					return `${this.typeRefToString(ref.items)}[]`;
				case 'primitive':
					return primitiveToString(ref as PrimitiveType);
				case 'enum':
					return ref.name;
				case 'unknown':
					return 'unknown';
				default:
					return 'unknown';
			}
		},

		getEndpointsByTag(tag: string): EndpointNode[] {
			return ast.endpoints.filter((e) => e.tags.includes(tag));
		},

		isQuery(endpoint: EndpointNode): boolean {
			return endpoint.queryType === 'query';
		},

		isMutation(endpoint: EndpointNode): boolean {
			return endpoint.queryType === 'mutation';
		},
	};
}

/**
 * Convert a primitive type to its TypeScript string representation
 */
function primitiveToString(prim: PrimitiveType): string {
	switch (prim.primitiveType) {
		case 'string':
			return 'string';
		case 'number':
		case 'integer':
			return 'number';
		case 'boolean':
			return 'boolean';
		case 'null':
			return 'null';
		case 'any':
			return 'unknown';
		default:
			return 'unknown';
	}
}

/**
 * Create a logger with optional prefix
 */
export function createLogger(prefix?: string): Logger {
	const formatMessage = (msg: string) => (prefix ? `[${prefix}] ${msg}` : msg);

	return {
		debug: (msg) => {
			if (process.env.DEBUG) {
				console.debug(formatMessage(msg));
			}
		},
		info: (msg) => console.info(formatMessage(msg)),
		warn: (msg) => console.warn(formatMessage(msg)),
		error: (msg) => console.error(formatMessage(msg)),
	};
}
