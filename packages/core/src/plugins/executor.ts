/**
 * Plugin executor
 *
 * Executes plugins through their lifecycle phases:
 * 1. onStart - Initialization
 * 2. onType/onEnum/onEndpoint - AST node processing
 * 3. emit - File generation
 * 4. onFile - File post-processing
 * 5. onEnd - Cleanup
 */

import type {
	Plugin,
	PluginContext,
	PluginBinding,
	Logger,
	PluginUtils,
} from '@schema-gen/plugin-sdk';
import type { SchemaAst, TypeNode, EnumNode, EndpointNode } from '../types';
import type { GeneratedFile } from '../binding';
import type { LoadedPlugin } from './loader';
import { createPluginUtils, createLogger } from './utils';

/**
 * Options for creating a plugin executor
 */
export interface PluginExecutorOptions {
	/** Loaded plugins with their configs */
	plugins: LoadedPlugin[];

	/** Output directory */
	outputDir: string;

	/** Config file directory */
	configDir: string;

	/** Rust binding for built-in generators */
	binding: PluginBinding;

	/** Optional custom logger */
	logger?: Logger;
}

/**
 * Result of plugin execution
 */
export interface PluginExecutorResult {
	/** Modified AST after Phase 2 */
	ast: SchemaAst;

	/** Generated files after Phase 3 & 4 */
	files: GeneratedFile[];
}

/**
 * Plugin executor class
 *
 * Executes plugins in config file order, failing fast on errors.
 */
export class PluginExecutor {
	private plugins: LoadedPlugin[];
	private outputDir: string;
	private configDir: string;
	private binding: PluginBinding;
	private logger: Logger;
	private shared: Map<string, unknown>;

	constructor(options: PluginExecutorOptions) {
		this.plugins = options.plugins;
		this.outputDir = options.outputDir;
		this.configDir = options.configDir;
		this.binding = options.binding;
		this.logger = options.logger ?? createLogger();
		this.shared = new Map();
	}

	/**
	 * Execute all plugins through their lifecycle phases
	 *
	 * @param ast - The initial AST from parsing
	 * @returns Modified AST and generated files
	 */
	async execute(ast: SchemaAst): Promise<PluginExecutorResult> {
		let currentAst = ast;

		// Phase 1: onStart
		await this.runPhase1_Start(currentAst);

		// Phase 2: AST node processing
		currentAst = await this.runPhase2_ProcessNodes(currentAst);

		// Phase 3: File emission
		let files = await this.runPhase3_Emit(currentAst);

		// Phase 4: File post-processing
		files = await this.runPhase4_ProcessFiles(files, currentAst);

		// Phase 5: onEnd
		await this.runPhase5_End(currentAst);

		return { ast: currentAst, files };
	}

	/**
	 * Phase 1: Run onStart hooks
	 */
	private async runPhase1_Start(ast: SchemaAst): Promise<void> {
		for (const { plugin, config } of this.plugins) {
			if (plugin.onStart) {
				const ctx = this.createContext(ast, config);
				this.logger.debug(`[${plugin.id}] Running onStart`);

				try {
					await plugin.onStart(ctx);
				} catch (error) {
					throw new Error(
						`Plugin "${plugin.id}" onStart failed: ${error instanceof Error ? error.message : error}`,
					);
				}
			}
		}
	}

	/**
	 * Phase 2: Process AST nodes through plugins
	 */
	private async runPhase2_ProcessNodes(ast: SchemaAst): Promise<SchemaAst> {
		let types = { ...ast.types };
		let enums = { ...ast.enums };
		let endpoints = [...ast.endpoints];

		// Process types
		for (const { plugin, config } of this.plugins) {
			if (plugin.onType) {
				const ctx = this.createContext(ast, config);
				const newTypes: Record<string, TypeNode> = {};

				for (const [id, node] of Object.entries(types)) {
					try {
						const result = plugin.onType(node, ctx);
						if (result === null) {
							// Filter out
							this.logger.debug(`[${plugin.id}] Filtered out type: ${id}`);
						} else if (result === undefined) {
							// Keep unchanged
							newTypes[id] = node;
						} else {
							// Use modified
							newTypes[id] = result;
						}
					} catch (error) {
						throw new Error(
							`Plugin "${plugin.id}" onType failed for "${id}": ${error instanceof Error ? error.message : error}`,
						);
					}
				}

				types = newTypes;
			}
		}

		// Process enums
		for (const { plugin, config } of this.plugins) {
			if (plugin.onEnum) {
				const ctx = this.createContext(ast, config);
				const newEnums: Record<string, EnumNode> = {};

				for (const [id, node] of Object.entries(enums)) {
					try {
						const result = plugin.onEnum(node, ctx);
						if (result === null) {
							this.logger.debug(`[${plugin.id}] Filtered out enum: ${id}`);
						} else if (result === undefined) {
							newEnums[id] = node;
						} else {
							newEnums[id] = result;
						}
					} catch (error) {
						throw new Error(
							`Plugin "${plugin.id}" onEnum failed for "${id}": ${error instanceof Error ? error.message : error}`,
						);
					}
				}

				enums = newEnums;
			}
		}

		// Process endpoints
		for (const { plugin, config } of this.plugins) {
			if (plugin.onEndpoint) {
				const ctx = this.createContext(ast, config);
				const newEndpoints: EndpointNode[] = [];

				for (const node of endpoints) {
					try {
						const result = plugin.onEndpoint(node, ctx);
						if (result === null) {
							this.logger.debug(`[${plugin.id}] Filtered out endpoint: ${node.id}`);
						} else if (result === undefined) {
							newEndpoints.push(node);
						} else {
							newEndpoints.push(result);
						}
					} catch (error) {
						throw new Error(
							`Plugin "${plugin.id}" onEndpoint failed for "${node.id}": ${error instanceof Error ? error.message : error}`,
						);
					}
				}

				endpoints = newEndpoints;
			}
		}

		return {
			...ast,
			types,
			enums,
			endpoints,
		};
	}

	/**
	 * Phase 3: Emit files from plugins
	 */
	private async runPhase3_Emit(ast: SchemaAst): Promise<GeneratedFile[]> {
		const allFiles: GeneratedFile[] = [];

		for (const { plugin, config } of this.plugins) {
			if (plugin.emit) {
				const ctx = this.createContext(ast, config);
				this.logger.debug(`[${plugin.id}] Running emit`);

				try {
					const files = await plugin.emit(ctx);
					allFiles.push(...files);
					this.logger.debug(`[${plugin.id}] Emitted ${files.length} file(s)`);
				} catch (error) {
					throw new Error(
						`Plugin "${plugin.id}" emit failed: ${error instanceof Error ? error.message : error}`,
					);
				}
			}
		}

		return allFiles;
	}

	/**
	 * Phase 4: Post-process files through plugins
	 */
	private async runPhase4_ProcessFiles(
		files: GeneratedFile[],
		ast: SchemaAst,
	): Promise<GeneratedFile[]> {
		let currentFiles = files;

		for (const { plugin, config } of this.plugins) {
			if (plugin.onFile) {
				const ctx = this.createContext(ast, config);
				const newFiles: GeneratedFile[] = [];

				for (const file of currentFiles) {
					try {
						const result = await plugin.onFile(file, ctx);
						if (result === null) {
							this.logger.debug(`[${plugin.id}] Filtered out file: ${file.path}`);
						} else if (result === undefined) {
							newFiles.push(file);
						} else {
							newFiles.push(result);
						}
					} catch (error) {
						throw new Error(
							`Plugin "${plugin.id}" onFile failed for "${file.path}": ${error instanceof Error ? error.message : error}`,
						);
					}
				}

				currentFiles = newFiles;
			}
		}

		return currentFiles;
	}

	/**
	 * Phase 5: Run onEnd hooks
	 */
	private async runPhase5_End(ast: SchemaAst): Promise<void> {
		for (const { plugin, config } of this.plugins) {
			if (plugin.onEnd) {
				const ctx = this.createContext(ast, config);
				this.logger.debug(`[${plugin.id}] Running onEnd`);

				try {
					await plugin.onEnd(ctx);
				} catch (error) {
					throw new Error(
						`Plugin "${plugin.id}" onEnd failed: ${error instanceof Error ? error.message : error}`,
					);
				}
			}
		}
	}

	/**
	 * Create a plugin context for a specific plugin
	 */
	private createContext(ast: SchemaAst, config: Record<string, unknown>): PluginContext {
		return {
			ast,
			config,
			outputDir: this.outputDir,
			configDir: this.configDir,
			log: this.logger,
			shared: this.shared,
			utils: createPluginUtils(ast),
			binding: this.binding,
		};
	}
}
