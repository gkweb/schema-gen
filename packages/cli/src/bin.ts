/**
 * schema-gen CLI
 *
 * High-performance OpenAPI to TypeScript/React Query/Vue Query code generation
 */

import { cac } from 'cac';
import pc from 'picocolors';
import {
	createGenerator,
	getVersion,
	loadConfig,
	loadConfigFromFile,
	validateConfig,
	validateSpec,
	parseSpecToJson,
	createDefaultConfig,
	type SchemaGenConfig,
} from '@schema-gen/core';
import * as fs from 'node:fs';
import * as path from 'node:path';

const cli = cac('schema-gen');

// Version
cli.version(getVersion());

// Generate command
cli
	.command('generate [spec]', 'Generate code from an OpenAPI specification')
	.alias('gen')
	.option('-c, --config <path>', 'Path to configuration file')
	.option('-i, --input <path>', 'Path to OpenAPI specification (alternative to positional arg)')
	.option('-o, --output <dir>', 'Output directory')
	.option('-w, --watch', 'Watch for changes')
	.action(async (spec: string | undefined, options: { config?: string; input?: string; output?: string; watch?: boolean }) => {
		console.log(pc.cyan('schema-gen') + ' ' + pc.dim(`v${getVersion()}`));
		console.log();

		try {
			// Load configuration
			let config: SchemaGenConfig;
			let configDir: string | undefined;

			if (options.config) {
				const result = await loadConfigFromFile(options.config);
				config = result.config;
				configDir = path.dirname(path.resolve(result.filepath));
				console.log(pc.dim(`Using config: ${result.filepath}`));
			} else {
				const result = await loadConfig();
				if (result) {
					config = result.config;
					configDir = path.dirname(path.resolve(result.filepath));
					console.log(pc.dim(`Using config: ${result.filepath}`));
				} else {
					console.log(pc.yellow('No config file found, using defaults'));
					config = createDefaultConfig();
				}
			}

			// Override with CLI options (positional arg takes precedence over -i option)
			if (spec) {
				config.input.path = spec;
			} else if (options.input) {
				config.input.path = options.input;
			}
			if (options.output) {
				config.output.dir = options.output;
			}

			// Validate configuration
			const errors = validateConfig(config);
			if (errors.length > 0) {
				console.error(pc.red('Configuration errors:'));
				for (const error of errors) {
					console.error(pc.red(`  - ${error}`));
				}
				process.exit(1);
			}

			// Create generator with config directory as base
			const generator = await createGenerator({ config, baseDir: configDir });

			console.log(pc.dim(`Input: ${config.input.path}`));
			console.log(pc.dim(`Output: ${config.output.dir}`));
			console.log();

			// Generate
			const startTime = performance.now();
			await generator.generate();
			const duration = performance.now() - startTime;

			console.log();
			console.log(pc.green(`✓ Generated in ${duration.toFixed(0)}ms`));

			// Watch mode
			if (options.watch) {
				console.log();
				console.log(pc.dim('Watching for changes...'));

				// Resolve spec path relative to config directory
				const baseDir = configDir ?? process.cwd();
				const specPath = path.resolve(baseDir, config.input.path);
				let debounceTimer: NodeJS.Timeout | null = null;

				fs.watch(specPath, async () => {
					if (debounceTimer) {
						clearTimeout(debounceTimer);
					}
					debounceTimer = setTimeout(async () => {
						console.log(pc.dim(`\nDetected change in ${config.input.path}`));
						try {
							const gen = await createGenerator({ config, baseDir: configDir });
							const start = performance.now();
							await gen.generate();
							console.log(pc.green(`✓ Regenerated in ${(performance.now() - start).toFixed(0)}ms`));
						} catch (err) {
							console.error(pc.red(`Error: ${err instanceof Error ? err.message : err}`));
						}
					}, 100);
				});

				// Keep process alive
				await new Promise(() => {});
			}
		} catch (err) {
			console.error(pc.red(`Error: ${err instanceof Error ? err.message : err}`));
			process.exit(1);
		}
	});

// Validate command
cli
	.command('validate <spec>', 'Validate an OpenAPI specification')
	.action(async (spec: string) => {
		try {
			const specPath = path.resolve(spec);
			const content = await fs.promises.readFile(specPath, 'utf-8');

			validateSpec(content);
			console.log(pc.green(`✓ ${spec} is valid`));
		} catch (err) {
			console.error(pc.red(`✗ ${spec} is invalid`));
			console.error(pc.red(`  ${err instanceof Error ? err.message : err}`));
			process.exit(1);
		}
	});

// AST command (for debugging)
cli
	.command('ast <spec>', 'Output the AST for an OpenAPI specification')
	.option('-f, --format <format>', 'Output format: json or yaml', { default: 'json' })
	.option('-o, --output <path>', 'Output file (default: stdout)')
	.action(async (spec: string, options: { format: string; output?: string }) => {
		try {
			const specPath = path.resolve(spec);
			const content = await fs.promises.readFile(specPath, 'utf-8');

			const ast = parseSpecToJson(content);

			if (options.output) {
				await fs.promises.writeFile(options.output, ast, 'utf-8');
				console.log(pc.green(`✓ AST written to ${options.output}`));
			} else {
				console.log(ast);
			}
		} catch (err) {
			console.error(pc.red(`Error: ${err instanceof Error ? err.message : err}`));
			process.exit(1);
		}
	});

// Init command
cli
	.command('init', 'Initialize a new schema-gen configuration')
	.option('-f, --force', 'Overwrite existing configuration')
	.action(async (options: { force?: boolean }) => {
		const configPath = 'schema-gen.config.ts';

		if (fs.existsSync(configPath) && !options.force) {
			console.error(pc.red(`Configuration file already exists: ${configPath}`));
			console.error(pc.dim('Use --force to overwrite'));
			process.exit(1);
		}

		const defaultConfig = `export default {
	input: {
		path: './openapi.yaml',
	},
	output: {
		dir: './src/api',
		clean: true,
	},
	plugins: [
		'typescript-types',
		'typescript-enums',
	],
};
`;

		await fs.promises.writeFile(configPath, defaultConfig, 'utf-8');
		console.log(pc.green(`✓ Created ${configPath}`));
	});

// Help
cli.help();

// Parse arguments
cli.parse();
