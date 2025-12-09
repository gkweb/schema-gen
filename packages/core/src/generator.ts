/**
 * High-level generator API
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import type { SchemaGenConfig } from './config';
import { generate, type GeneratedFile, parseSpec } from './binding';
import type { SchemaAst } from './types';

/**
 * Generator instance for running code generation
 */
export interface Generator {
	/** The loaded AST */
	ast: SchemaAst;

	/** Run all configured generators */
	run(): Promise<GeneratedFile[]>;

	/** Write generated files to disk */
	write(files: GeneratedFile[]): Promise<void>;

	/** Run and write in one step */
	generate(): Promise<void>;
}

/**
 * Options for creating a generator
 */
export interface CreateGeneratorOptions {
	/** OpenAPI spec content (alternative to config.input.path) */
	spec?: string;
	/** Spec format (auto-detected if not provided) */
	format?: 'json' | 'yaml';
	/** Configuration */
	config: SchemaGenConfig;
	/** Base directory for resolving relative paths (defaults to process.cwd()) */
	baseDir?: string;
}

/**
 * Create a generator instance
 *
 * @param options - Generator options
 * @returns A generator instance
 */
export async function createGenerator(options: CreateGeneratorOptions): Promise<Generator> {
	const { config } = options;

	// Determine base directory for resolving relative paths
	// Priority: config.cwd > options.baseDir > process.cwd()
	const baseDir = config.cwd
		? path.resolve(config.cwd)
		: options.baseDir
			? path.resolve(options.baseDir)
			: process.cwd();

	// Load spec content
	let specContent: string;
	if (options.spec) {
		specContent = options.spec;
	} else {
		const specPath = path.resolve(baseDir, config.input.path);
		specContent = await fs.promises.readFile(specPath, 'utf-8');
	}

	// Detect format
	const format =
		options.format ?? (config.input.path.endsWith('.json') ? 'json' : 'yaml');

	// Parse the spec
	const ast = parseSpec(specContent, format) as SchemaAst;

	// Determine which generators to run
	const generatorNames = config.plugins
		.map((p) => (typeof p === 'string' ? p : p.name))
		.filter((name) => isBuiltinGenerator(name));

	const run = async (): Promise<GeneratedFile[]> => {
		const files = generate(specContent, generatorNames, {
			format,
			typescript: config.style
				? {
						generateJsdoc: true,
					}
				: undefined,
		});

		return files;
	};

	const write = async (files: GeneratedFile[]): Promise<void> => {
		const outputDir = path.resolve(baseDir, config.output.dir);

		// Clean output directory if configured
		if (config.output.clean) {
			await fs.promises.rm(outputDir, { recursive: true, force: true });
		}

		// Ensure output directory exists
		await fs.promises.mkdir(outputDir, { recursive: true });

		// Write each file
		for (const file of files) {
			const filePath = path.join(outputDir, file.path);
			const fileDir = path.dirname(filePath);

			await fs.promises.mkdir(fileDir, { recursive: true });
			await fs.promises.writeFile(filePath, file.content, 'utf-8');

			console.log(`Generated: ${file.path}`);
		}
	};

	return {
		ast,
		run,
		write,
		async generate(): Promise<void> {
			const files = await run();
			await write(files);
		},
	};
}

/**
 * Check if a plugin name is a built-in generator
 */
function isBuiltinGenerator(name: string): boolean {
	return ['typescript-types', 'typescript-enums', 'constants'].includes(name);
}
