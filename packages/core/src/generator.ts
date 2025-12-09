/**
 * High-level generator API
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import type { SchemaGenConfig } from './config';
import { parseSpec, native, type GeneratedFile } from './binding';
import type { SchemaAst } from './types';
import { loadPlugins } from './plugins/loader';
import { PluginExecutor } from './plugins/executor';
import type { PluginBinding } from '@schema-gen/plugin-sdk';

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
 * Create a plugin binding that wraps the native Rust generators
 */
function createPluginBinding(): PluginBinding {
	return {
		generateTypes(ast: SchemaAst, options?: Record<string, unknown>): GeneratedFile[] {
			const astJson = JSON.stringify(ast);
			const optionsJson = options ? JSON.stringify(options) : undefined;
			return native.generateTypescriptTypes(astJson, optionsJson);
		},
		generateEnums(ast: SchemaAst, options?: Record<string, unknown>): GeneratedFile[] {
			const astJson = JSON.stringify(ast);
			const optionsJson = options ? JSON.stringify(options) : undefined;
			return native.generateTypescriptEnums(astJson, optionsJson);
		},
		generateConstants(ast: SchemaAst, options?: Record<string, unknown>): GeneratedFile[] {
			const astJson = JSON.stringify(ast);
			const optionsJson = options ? JSON.stringify(options) : undefined;
			return native.generateConstants(astJson, optionsJson);
		},
	};
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

	// Load plugins
	const plugins = await loadPlugins(config.plugins, baseDir);

	// Create plugin binding
	const binding = createPluginBinding();

	// Determine output directory
	const outputDir = path.resolve(baseDir, config.output.dir);

	// Create executor
	const executor = new PluginExecutor({
		plugins,
		outputDir,
		configDir: baseDir,
		binding,
	});

	const run = async (): Promise<GeneratedFile[]> => {
		const result = await executor.execute(ast);
		return result.files;
	};

	const write = async (files: GeneratedFile[]): Promise<void> => {
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
