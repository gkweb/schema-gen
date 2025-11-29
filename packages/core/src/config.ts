/**
 * Configuration loading and validation
 */

import { cosmiconfig } from 'cosmiconfig';

/**
 * Schema-gen configuration
 */
export interface SchemaGenConfig {
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
	transform?: {
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
	};

	/** Fetch strategy configuration */
	fetch?: {
		/** Default fetch implementation */
		default?: 'fetch' | 'axios' | 'ky' | 'custom';
		/** Custom implementation */
		custom?: {
			import: string;
			function: string;
		};
		/** Per-endpoint overrides */
		overrides?: Record<string, string>;
	};

	/** React Query specific options */
	reactQuery?: {
		/** Query key factory style */
		queryKeys?: 'array' | 'object';
		/** Suspense support */
		suspense?: boolean;
		/** Infinite query detection */
		infiniteQueries?: {
			detectByParam?: string[];
		};
	};

	/** Vue Query specific options */
	vueQuery?: {
		/** Composition API style */
		compositionApi?: boolean;
	};

	/** Code style */
	style?: {
		semi?: boolean;
		quotes?: 'single' | 'double';
		trailingComma?: 'all' | 'es5' | 'none';
		tabWidth?: number;
		useTabs?: boolean;
		printWidth?: number;
	};
}

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
	isEmpty?: boolean;
}

const MODULE_NAME = 'schema-gen';

/**
 * Load configuration from the filesystem
 *
 * Searches for configuration in the following locations:
 * - schema-gen.config.js
 * - schema-gen.config.ts
 * - schema-gen.config.yaml
 * - schema-gen.config.yml
 * - schema-gen.config.json
 * - .schema-genrc
 * - .schema-genrc.json
 * - .schema-genrc.yaml
 * - .schema-genrc.yml
 * - package.json (schema-gen field)
 *
 * @param searchFrom - Directory to start searching from (default: process.cwd())
 * @returns The configuration and its filepath, or null if not found
 */
export async function loadConfig(searchFrom?: string): Promise<ConfigResult | null> {
	const explorer = cosmiconfig(MODULE_NAME, {
		searchPlaces: [
			'package.json',
			`.${MODULE_NAME}rc`,
			`.${MODULE_NAME}rc.json`,
			`.${MODULE_NAME}rc.yaml`,
			`.${MODULE_NAME}rc.yml`,
			`.${MODULE_NAME}rc.js`,
			`.${MODULE_NAME}rc.cjs`,
			`${MODULE_NAME}.config.js`,
			`${MODULE_NAME}.config.cjs`,
			`${MODULE_NAME}.config.ts`,
			`${MODULE_NAME}.config.yaml`,
			`${MODULE_NAME}.config.yml`,
			`${MODULE_NAME}.config.json`,
		],
	});

	const result = await explorer.search(searchFrom);

	if (!result || result.isEmpty) {
		return null;
	}

	return {
		config: result.config as SchemaGenConfig,
		filepath: result.filepath,
		isEmpty: result.isEmpty,
	};
}

/**
 * Load configuration from a specific file
 *
 * @param filepath - Path to the configuration file
 * @returns The configuration
 */
export async function loadConfigFromFile(filepath: string): Promise<ConfigResult> {
	const explorer = cosmiconfig(MODULE_NAME);
	const result = await explorer.load(filepath);

	if (!result) {
		throw new Error(`Failed to load config from ${filepath}`);
	}

	return {
		config: result.config as SchemaGenConfig,
		filepath: result.filepath,
		isEmpty: result.isEmpty,
	};
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
