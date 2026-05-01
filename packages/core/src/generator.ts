/**
 * High-level generator API
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { createJiti } from 'jiti';
import type { SchemaGenConfig, SpecTransformer } from './config';
import { parseSpec, parseRawSpec, transformSpec, native, type GeneratedFile } from './binding';
import type { SchemaAst } from './types';
import { loadPlugins } from './plugins/loader';
import { PluginExecutor } from './plugins/executor';
import type { PluginBinding, WrittenFile } from '@schema-gen/plugin-sdk';

/**
 * Generator instance for running code generation
 */
export interface Generator {
  /** The loaded AST */
  ast: SchemaAst;

  /** Run all configured generators */
  run(): Promise<GeneratedFile[]>;

  /** Write generated files to disk */
  write(files: GeneratedFile[]): Promise<WrittenFile[]>;

  /** Run and write in one step (also runs onFinished hooks) */
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
 * Resolve a {@link SpecTransformer} value into a callable function.
 *
 * String values are treated as module paths and loaded via `jiti` so that
 * TypeScript files work without a separate compile step. The default export
 * is used; if the module exports the function under a different name, the
 * user should write a small wrapper.
 */
async function resolveTransformer(
  value: SpecTransformer | string,
  baseDir: string,
): Promise<SpecTransformer> {
  if (typeof value === 'function') {
    return value;
  }

  const modulePath = path.resolve(baseDir, value);
  const jiti = createJiti(modulePath, {
    interopDefault: true,
    extensions: ['.ts', '.mts', '.cts', '.js', '.mjs', '.cjs'],
  });
  const loaded = (await jiti.import(modulePath)) as
    | SpecTransformer
    | { default?: SpecTransformer };

  const fn =
    typeof loaded === 'function' ? loaded : typeof loaded?.default === 'function' ? loaded.default : null;

  if (!fn) {
    throw new Error(
      `input.transformer at "${value}" must default-export a function (spec) => spec`,
    );
  }
  return fn;
}

/**
 * Load OpenAPI spec from file or URL
 *
 * @param config - The schema-gen configuration
 * @param baseDir - Base directory for resolving relative paths
 * @returns The spec content as a string
 */
async function loadSpec(config: SchemaGenConfig, baseDir: string): Promise<string> {
  const inputPath = config.input.path;

  // Check if URL
  if (inputPath.startsWith('http://') || inputPath.startsWith('https://')) {
    const httpOptions = config.input.parserOptions?.resolve?.http ?? {};
    const headers = httpOptions.headers ?? {};
    const timeout = httpOptions.timeout ?? 30000;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      console.log(`Fetching schema from: ${inputPath}`);
      const response = await fetch(inputPath, {
        headers,
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch schema: ${response.status} ${response.statusText}`);
      }

      return await response.text();
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(`Request timeout after ${timeout}ms: ${inputPath}`);
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  // Local file
  const specPath = path.resolve(baseDir, inputPath);
  return fs.promises.readFile(specPath, 'utf-8');
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
    specContent = await loadSpec(config, baseDir);
  }

  // Detect format
  const format = options.format ?? (config.input.path.endsWith('.json') ? 'json' : 'yaml');

  // Load plugins
  const plugins = await loadPlugins(config.plugins, baseDir);

  // Create plugin binding
  const binding = createPluginBinding();

  // Determine output directory
  const outputDir = path.resolve(baseDir, config.output.dir);

  // Determine types output directory (if configured)
  const typesDir = config.output.types?.dir
    ? path.resolve(outputDir, config.output.types.dir)
    : undefined;

  // Create executor
  const executor = new PluginExecutor({
    plugins,
    outputDir,
    typesDir,
    configDir: baseDir,
    outputStructure: config.output.structure ?? 'flat',
    binding,
  });

  // Phase 0: pre-parse spec mutation (input.transformer + plugin onSpec hooks)
  const hasUserTransformer = config.input.transformer !== undefined;
  const hasPluginOnSpec = plugins.some(({ plugin }) => plugin.onSpec !== undefined);

  let ast: SchemaAst;
  if (hasUserTransformer || hasPluginOnSpec) {
    let rawSpec = parseRawSpec(specContent, format);

    if (hasUserTransformer) {
      const transformer = await resolveTransformer(config.input.transformer!, baseDir);
      rawSpec = await transformer(rawSpec);
    }

    rawSpec = await executor.runOnSpec(rawSpec);
    ast = transformSpec(rawSpec) as SchemaAst;
  } else {
    ast = parseSpec(specContent, format) as SchemaAst;
  }

  const run = async (): Promise<GeneratedFile[]> => {
    const result = await executor.execute(ast);
    return result.files;
  };

  const write = async (files: GeneratedFile[]): Promise<WrittenFile[]> => {
    // Clean output directory if configured
    if (config.output.clean) {
      await fs.promises.rm(outputDir, { recursive: true, force: true });
    }

    // Ensure output directory exists
    await fs.promises.mkdir(outputDir, { recursive: true });

    // Track written files for onFinished hook
    const writtenFiles: WrittenFile[] = [];

    // Write each file
    for (const file of files) {
      const filePath = path.join(outputDir, file.path);
      const fileDir = path.dirname(filePath);

      await fs.promises.mkdir(fileDir, { recursive: true });
      await fs.promises.writeFile(filePath, file.content, 'utf-8');

      writtenFiles.push({
        absolutePath: filePath,
        relativePath: file.path,
        content: file.content,
      });

      console.log(`Generated: ${file.path}`);
    }

    return writtenFiles;
  };

  return {
    ast,
    run,
    write,
    async generate(): Promise<void> {
      const files = await run();
      const writtenFiles = await write(files);

      // Run onFinished hooks after files are written
      await executor.runOnFinished(ast, writtenFiles);
    },
  };
}
