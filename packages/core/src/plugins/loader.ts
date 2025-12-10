/**
 * Plugin loader
 *
 * Loads plugins from:
 * - Built-in names (typescript-types, typescript-enums, constants)
 * - NPM packages (@schema-gen/plugin-*)
 * - Local file paths (./plugins/custom.ts)
 */

import type { Plugin, PluginContext } from '@schema-gen/plugin-sdk';
import type { PluginConfig, PluginObject } from '../config';
import * as path from 'node:path';

// Built-in plugins
import typescriptTypes from './builtins/typescript-types';
import typescriptEnums from './builtins/typescript-enums';
import constants from './builtins/constants';
import requestPaths from './builtins/request-paths';

/**
 * Map of built-in plugin names to their implementations
 */
const BUILTIN_PLUGINS: Record<string, Plugin> = {
	'typescript-types': typescriptTypes,
	'typescript-enums': typescriptEnums,
	constants: constants,
	'request-paths': requestPaths,
};

/**
 * Loaded plugin with its configuration
 */
export interface LoadedPlugin {
	plugin: Plugin;
	config: Record<string, unknown>;
}

/**
 * Load all plugins from configuration
 *
 * @param configs - Plugin configurations from user config
 * @param configDir - Directory of the config file (for resolving relative paths)
 * @returns Array of loaded plugins with their configs
 */
export async function loadPlugins(
	configs: PluginConfig[],
	configDir: string,
): Promise<LoadedPlugin[]> {
	const loaded: LoadedPlugin[] = [];

	for (const config of configs) {
		// Check if it's a plugin object passed directly
		if (isPluginObject(config)) {
			loaded.push({
				plugin: config as unknown as Plugin,
				config: {},
			});
			continue;
		}

		const { name, pluginConfig } = normalizePluginConfig(config);
		const plugin = await loadPlugin(name, configDir);

		loaded.push({
			plugin,
			config: pluginConfig,
		});
	}

	return loaded;
}

/**
 * Check if a config entry is a plugin object (has id, name, version)
 */
function isPluginObject(config: PluginConfig): config is PluginObject {
	if (typeof config !== 'object' || config === null) return false;
	const obj = config as Record<string, unknown>;
	return (
		typeof obj.id === 'string' &&
		typeof obj.name === 'string' &&
		typeof obj.version === 'string'
	);
}

/**
 * Normalize plugin configuration to { name, config } format
 */
function normalizePluginConfig(config: PluginConfig): {
	name: string;
	pluginConfig: Record<string, unknown>;
} {
	if (typeof config === 'string') {
		return { name: config, pluginConfig: {} };
	}

	return {
		name: config.name,
		pluginConfig: config.config ?? {},
	};
}

/**
 * Load a single plugin by name
 *
 * @param name - Plugin name (builtin, npm package, or local path)
 * @param configDir - Directory for resolving relative paths
 * @returns The loaded plugin
 */
async function loadPlugin(name: string, configDir: string): Promise<Plugin> {
	// Check if it's a built-in plugin
	if (name in BUILTIN_PLUGINS) {
		return BUILTIN_PLUGINS[name];
	}

	// Check if it's a local path
	if (name.startsWith('./') || name.startsWith('../') || name.startsWith('/')) {
		return loadLocalPlugin(name, configDir);
	}

	// Otherwise, try to load as an npm package
	return loadNpmPlugin(name);
}

/**
 * Load a plugin from a local file path
 */
async function loadLocalPlugin(relativePath: string, configDir: string): Promise<Plugin> {
	const absolutePath = path.resolve(configDir, relativePath);

	try {
		// Dynamic import for ESM/CJS compatibility
		const module = await import(absolutePath);
		const plugin = module.default ?? module;

		validatePlugin(plugin, relativePath);
		return plugin;
	} catch (error) {
		throw new Error(
			`Failed to load local plugin from "${relativePath}": ${error instanceof Error ? error.message : error}`,
		);
	}
}

/**
 * Load a plugin from an npm package
 */
async function loadNpmPlugin(packageName: string): Promise<Plugin> {
	try {
		// Dynamic import for npm packages
		const module = await import(packageName);
		const plugin = module.default ?? module;

		validatePlugin(plugin, packageName);
		return plugin;
	} catch (error) {
		throw new Error(
			`Failed to load npm plugin "${packageName}": ${error instanceof Error ? error.message : error}`,
		);
	}
}

/**
 * Validate that a loaded module is a valid plugin
 */
function validatePlugin(plugin: unknown, source: string): asserts plugin is Plugin {
	if (!plugin || typeof plugin !== 'object') {
		throw new Error(`Plugin from "${source}" must export an object`);
	}

	const p = plugin as Record<string, unknown>;

	if (typeof p.id !== 'string' || !p.id) {
		throw new Error(`Plugin from "${source}" must have a string "id" property`);
	}

	if (typeof p.name !== 'string' || !p.name) {
		throw new Error(`Plugin from "${source}" must have a string "name" property`);
	}

	if (typeof p.version !== 'string' || !p.version) {
		throw new Error(`Plugin from "${source}" must have a string "version" property`);
	}
}

/**
 * Get list of built-in plugin names
 */
export function getBuiltinPluginNames(): string[] {
	return Object.keys(BUILTIN_PLUGINS);
}
