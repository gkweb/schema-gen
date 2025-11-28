/**
 * Native binding loader
 *
 * This module loads the appropriate native binary for the current platform.
 * The binaries are distributed as separate npm packages (optionalDependencies).
 */

/* eslint-disable @typescript-eslint/no-require-imports */

interface NativeBinding {
	parseSpecToAst: (content: string, format?: string) => string;
	parseSpecToObject: (content: string, format?: string) => unknown;
	validateSpec: (content: string, format?: string) => boolean;
	generateTypescriptTypes: (astJson: string, options?: string) => GeneratedFile[];
	generateTypescriptEnums: (astJson: string, options?: string) => GeneratedFile[];
	generateConstants: (astJson: string, options?: string) => GeneratedFile[];
	generate: (
		content: string,
		format: string | undefined,
		generators: string[],
		options?: string,
	) => GeneratedFile[];
	getVersion: () => string;
}

export interface GeneratedFile {
	path: string;
	content: string;
	skipFormat: boolean;
}

let nativeBinding: NativeBinding | null = null;

/**
 * Load the native binding for the current platform
 */
function loadBinding(): NativeBinding {
	if (nativeBinding) {
		return nativeBinding;
	}

	const platform = process.platform;
	const arch = process.arch;

	// Try to load the native module
	const possiblePaths: string[] = [];

	// Platform-specific package names
	if (platform === 'darwin') {
		if (arch === 'arm64') {
			possiblePaths.push('@schema-gen/binding-darwin-arm64');
		} else if (arch === 'x64') {
			possiblePaths.push('@schema-gen/binding-darwin-x64');
		}
	} else if (platform === 'linux') {
		if (arch === 'arm64') {
			possiblePaths.push('@schema-gen/binding-linux-arm64-gnu');
			possiblePaths.push('@schema-gen/binding-linux-arm64-musl');
		} else if (arch === 'x64') {
			possiblePaths.push('@schema-gen/binding-linux-x64-gnu');
			possiblePaths.push('@schema-gen/binding-linux-x64-musl');
		}
	} else if (platform === 'win32') {
		if (arch === 'arm64') {
			possiblePaths.push('@schema-gen/binding-win32-arm64-msvc');
		} else if (arch === 'x64') {
			possiblePaths.push('@schema-gen/binding-win32-x64-msvc');
		}
	}

	// Also try local .node file (for development)
	possiblePaths.push('./schema-gen.node');
	possiblePaths.push('../schema-gen.node');
	possiblePaths.push(`./schema-gen.${platform}-${arch}.node`);

	// Try each path
	for (const modulePath of possiblePaths) {
		try {
			nativeBinding = require(modulePath) as NativeBinding;
			return nativeBinding;
		} catch {
			// Try next path
		}
	}

	throw new Error(
		`Failed to load native binding for ${platform}-${arch}. ` +
			'Please ensure the correct platform package is installed.',
	);
}

/**
 * Parse an OpenAPI specification and return the AST
 *
 * @param content - The specification content (JSON or YAML string)
 * @param format - The format: "json" or "yaml" (optional, auto-detected if not provided)
 * @returns The AST as a parsed object
 */
export function parseSpec(content: string, format?: 'json' | 'yaml'): unknown {
	const binding = loadBinding();
	return binding.parseSpecToObject(content, format);
}

/**
 * Parse an OpenAPI specification and return the AST as JSON
 *
 * @param content - The specification content (JSON or YAML string)
 * @param format - The format: "json" or "yaml" (optional, auto-detected if not provided)
 * @returns The AST as a JSON string
 */
export function parseSpecToJson(content: string, format?: 'json' | 'yaml'): string {
	const binding = loadBinding();
	return binding.parseSpecToAst(content, format);
}

/**
 * Validate an OpenAPI specification
 *
 * @param content - The specification content (JSON or YAML string)
 * @param format - The format: "json" or "yaml" (optional, auto-detected if not provided)
 * @returns True if valid
 * @throws Error if the specification is invalid
 */
export function validateSpec(content: string, format?: 'json' | 'yaml'): boolean {
	const binding = loadBinding();
	return binding.validateSpec(content, format);
}

/**
 * Generate code from a specification
 *
 * @param content - The specification content (JSON or YAML string)
 * @param generators - Array of generator names to run
 * @param options - Generation options
 * @returns Array of generated files
 */
export function generate(
	content: string,
	generators: string[],
	options?: {
		format?: 'json' | 'yaml';
		typescript?: {
			preferInterfaces?: boolean;
			readonlyProperties?: boolean;
			generateJsdoc?: boolean;
			enumStyle?: 'enum' | 'const-enum' | 'union';
		};
	},
): GeneratedFile[] {
	const binding = loadBinding();
	const optionsJson = options ? JSON.stringify(options) : undefined;
	return binding.generate(content, options?.format, generators, optionsJson);
}

/**
 * Get the native library version
 */
export function getVersion(): string {
	const binding = loadBinding();
	return binding.getVersion();
}

// Export low-level functions for advanced use
export const native = {
	generateTypescriptTypes: (astJson: string, options?: string): GeneratedFile[] => {
		const binding = loadBinding();
		return binding.generateTypescriptTypes(astJson, options);
	},
	generateTypescriptEnums: (astJson: string, options?: string): GeneratedFile[] => {
		const binding = loadBinding();
		return binding.generateTypescriptEnums(astJson, options);
	},
	generateConstants: (astJson: string, options?: string): GeneratedFile[] => {
		const binding = loadBinding();
		return binding.generateConstants(astJson, options);
	},
};
