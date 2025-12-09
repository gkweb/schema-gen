/**
 * Configuration loading and validation
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { pathToFileURL } from 'node:url';

/**
 * User-facing configuration options
 *
 * This is the type users interact with in their config files.
 */
export interface UserConfig {
	/** Working directory for resolving relative paths (defaults to config file directory) */
	cwd?: string;

	/** Input specification */
	input: {
		/** Path to OpenAPI spec (local file or URL) */
		path: string;
		/** Validation strictness */
		validation?: 'strict' | 'warn' | 'off';
	};

	/** Output configuration */
	output: {
		/** Output directory */
		dir: string;
		/** File organization strategy */
		structure?: 'flat' | 'by-tag' | 'by-endpoint';
		/** Clean output directory before generation */
		clean?: boolean;
	};

	/** Plugin configuration */
	plugins: PluginConfig[];

	/** Global transforms */
	transform?: TransformConfig;

	/** Fetch strategy configuration */
	fetch?: FetchConfig;

	/** React Query specific options */
	reactQuery?: ReactQueryConfig;

	/** Vue Query specific options */
	vueQuery?: VueQueryConfig;

	/** Code style */
	style?: StyleConfig;
}

/**
 * Transform configuration
 */
export interface TransformConfig {
	/** Naming conventions */
	naming?: {
		types?: 'PascalCase' | 'camelCase' | 'preserve';
		properties?: 'PascalCase' | 'camelCase' | 'snake_case' | 'preserve';
		enums?: 'PascalCase' | 'SCREAMING_SNAKE' | 'preserve';
	};
	/** Type mappings */
	typeOverrides?: Record<string, string>;
	/** Include filters */
	include?: {
		tags?: string[];
		paths?: string[];
	};
	/** Exclude filters */
	exclude?: {
		tags?: string[];
		operationIds?: string[];
	};
}

/**
 * Fetch configuration
 */
export interface FetchConfig {
	/** Default fetch implementation */
	default?: 'fetch' | 'axios' | 'ky' | 'custom';
	/** Custom implementation */
	custom?: {
		import: string;
		function: string;
	};
	/** Per-endpoint overrides */
	overrides?: Record<string, string>;
}

/**
 * React Query configuration
 */
export interface ReactQueryConfig {
	/** Query key factory style */
	queryKeys?: 'array' | 'object';
	/** Suspense support */
	suspense?: boolean;
	/** Infinite query detection */
	infiniteQueries?: {
		detectByParam?: string[];
	};
}

/**
 * Vue Query configuration
 */
export interface VueQueryConfig {
	/** Composition API style */
	compositionApi?: boolean;
}

/**
 * Code style configuration
 */
export interface StyleConfig {
	semi?: boolean;
	quotes?: 'single' | 'double';
	trailingComma?: 'all' | 'es5' | 'none';
	tabWidth?: number;
	useTabs?: boolean;
	printWidth?: number;
}

/**
 * Define a schema-gen configuration with full type support
 *
 * @example
 * ```typescript
 * // schema-gen.config.ts
 * import { defineConfig } from '@schema-gen/core';
 *
 * export default defineConfig({
 *   input: {
 *     path: './openapi.yaml',
 *   },
 *   output: {
 *     dir: './src/api',
 *     clean: true,
 *   },
 *   plugins: [
 *     'typescript-types',
 *     'typescript-enums',
 *   ],
 * });
 * ```
 */
export function defineConfig(config: UserConfig): UserConfig {
	return config;
}

/**
 * Resolved configuration (same as UserConfig for now)
 */
export type SchemaGenConfig = UserConfig;

/**
 * Plugin configuration
 */
export type PluginConfig =
	| string
	| {
			name: string;
			path?: string;
			config?: Record<string, unknown>;
	  };

/**
 * Configuration search result
 */
export interface ConfigResult {
	config: SchemaGenConfig;
	filepath: string;
}

/**
 * Config file names to search for (in order of priority)
 */
const CONFIG_FILES = [
	'schema-gen.config.ts',
	'schema-gen.config.js',
	'schema-gen.config.mjs',
];

/**
 * Load configuration by searching for config files
 *
 * @param searchFrom - Directory to start searching from (default: process.cwd())
 * @returns The configuration and its filepath, or null if not found
 */
export async function loadConfig(searchFrom?: string): Promise<ConfigResult | null> {
	const startDir = searchFrom ?? process.cwd();

	for (const filename of CONFIG_FILES) {
		const filepath = path.resolve(startDir, filename);
		if (fs.existsSync(filepath)) {
			return loadConfigFromFile(filepath);
		}
	}

	return null;
}

/**
 * Load configuration from a specific file
 *
 * @param filepath - Path to the configuration file
 * @returns The configuration
 */
export async function loadConfigFromFile(filepath: string): Promise<ConfigResult> {
	const absolutePath = path.resolve(filepath);

	if (!fs.existsSync(absolutePath)) {
		throw new Error(`Config file not found: ${filepath}`);
	}

	// Use file:// URL for ESM import
	const fileUrl = pathToFileURL(absolutePath).href;

	try {
		const module = await import(fileUrl);
		const config = module.default ?? module;

		return {
			config: config as SchemaGenConfig,
			filepath: absolutePath,
		};
	} catch (error) {
		// Provide helpful error for TypeScript files
		if (absolutePath.endsWith('.ts') && error instanceof Error) {
			throw new Error(
				`Failed to load TypeScript config: ${filepath}\n` +
					`Run with tsx: npx tsx node_modules/.bin/schema-gen generate\n` +
					`Or use a .js config file instead.\n` +
					`Original error: ${error.message}`,
			);
		}
		throw error;
	}
}

/**
 * Validate a configuration object
 *
 * @param config - The configuration to validate
 * @returns Array of validation errors (empty if valid)
 */
export function validateConfig(config: unknown): string[] {
	const errors: string[] = [];

	if (!config || typeof config !== 'object') {
		return ['Configuration must be an object'];
	}

	const cfg = config as Record<string, unknown>;

	// Required: input
	if (!cfg.input || typeof cfg.input !== 'object') {
		errors.push('Missing required field: input');
	} else {
		const input = cfg.input as Record<string, unknown>;
		if (!input.path || typeof input.path !== 'string') {
			errors.push('Missing required field: input.path');
		}
	}

	// Required: output
	if (!cfg.output || typeof cfg.output !== 'object') {
		errors.push('Missing required field: output');
	} else {
		const output = cfg.output as Record<string, unknown>;
		if (!output.dir || typeof output.dir !== 'string') {
			errors.push('Missing required field: output.dir');
		}
	}

	// Required: plugins
	if (!cfg.plugins || !Array.isArray(cfg.plugins)) {
		errors.push('Missing required field: plugins (must be an array)');
	}

	return errors;
}

/**
 * Create a default configuration
 */
export function createDefaultConfig(): SchemaGenConfig {
	return {
		input: {
			path: './openapi.yaml',
			validation: 'warn',
		},
		output: {
			dir: './src/api',
			structure: 'flat',
			clean: true,
		},
		plugins: ['typescript-types', 'typescript-enums'],
		style: {
			semi: true,
			quotes: 'single',
			trailingComma: 'all',
			tabWidth: 2,
			useTabs: false,
			printWidth: 100,
		},
	};
}
