/**
 * Plugin Utilities Tests
 *
 * Comprehensive test coverage for the plugin utility functions including:
 * - Case conversion utilities (toPascalCase, toCamelCase, toSnakeCase, etc.)
 * - Type reference resolution (typeRefToString)
 * - Endpoint classification (isQuery, isMutation, getEndpointsByTag)
 */

import { describe, it, expect } from 'vitest';
import { createPluginUtils, createLogger } from './utils';
import type { SchemaAst, EndpointNode, TypeRef } from '../types';

// ============================================================================
// Test Fixtures
// ============================================================================

/**
 * Create a minimal AST for testing
 */
function createTestAst(endpoints: EndpointNode[] = []): SchemaAst {
	return {
		info: {
			title: 'Test API',
			version: '1.0.0',
			servers: [{ url: 'https://api.example.com' }],
		},
		types: {},
		enums: {},
		endpoints,
		tags: [],
	};
}

/**
 * Create a test endpoint
 */
function createEndpoint(overrides: Partial<EndpointNode> = {}): EndpointNode {
	return {
		id: 'test-endpoint',
		operationId: 'testOperation',
		method: 'GET',
		path: '/test',
		tags: [],
		parameters: [],
		responses: [],
		security: [],
		deprecated: false,
		queryType: 'query',
		...overrides,
	};
}

// ============================================================================
// Tests: Case Conversion Utilities
// ============================================================================

describe('Plugin Utils', () => {
	describe('toPascalCase', () => {
		it('should convert snake_case to PascalCase', () => {
			const ast = createTestAst();
			const utils = createPluginUtils(ast);

			expect(utils.toPascalCase('hello_world')).toBe('HelloWorld');
			expect(utils.toPascalCase('user_profile_data')).toBe('UserProfileData');
			expect(utils.toPascalCase('api_response')).toBe('ApiResponse');
		});

		it('should convert kebab-case to PascalCase', () => {
			const ast = createTestAst();
			const utils = createPluginUtils(ast);

			expect(utils.toPascalCase('hello-world')).toBe('HelloWorld');
			expect(utils.toPascalCase('user-profile-data')).toBe('UserProfileData');
			expect(utils.toPascalCase('api-response')).toBe('ApiResponse');
		});

		it('should convert space separated to PascalCase', () => {
			const ast = createTestAst();
			const utils = createPluginUtils(ast);

			expect(utils.toPascalCase('hello world')).toBe('HelloWorld');
			expect(utils.toPascalCase('user profile data')).toBe('UserProfileData');
		});

		it('should convert dot separated to PascalCase', () => {
			const ast = createTestAst();
			const utils = createPluginUtils(ast);

			expect(utils.toPascalCase('hello.world')).toBe('HelloWorld');
			expect(utils.toPascalCase('user.profile.data')).toBe('UserProfileData');
		});

		it('should handle single words', () => {
			const ast = createTestAst();
			const utils = createPluginUtils(ast);

			expect(utils.toPascalCase('hello')).toBe('Hello');
			expect(utils.toPascalCase('user')).toBe('User');
		});

		it('should handle already PascalCase', () => {
			const ast = createTestAst();
			const utils = createPluginUtils(ast);

			expect(utils.toPascalCase('HelloWorld')).toBe('HelloWorld');
			expect(utils.toPascalCase('UserProfile')).toBe('UserProfile');
		});

		it('should handle mixed separators', () => {
			const ast = createTestAst();
			const utils = createPluginUtils(ast);

			expect(utils.toPascalCase('hello_world-test.data')).toBe('HelloWorldTestData');
		});

		it('should handle empty string', () => {
			const ast = createTestAst();
			const utils = createPluginUtils(ast);

			expect(utils.toPascalCase('')).toBe('');
		});
	});

	describe('toCamelCase', () => {
		it('should convert snake_case to camelCase', () => {
			const ast = createTestAst();
			const utils = createPluginUtils(ast);

			expect(utils.toCamelCase('hello_world')).toBe('helloWorld');
			expect(utils.toCamelCase('user_profile_data')).toBe('userProfileData');
			expect(utils.toCamelCase('api_response')).toBe('apiResponse');
		});

		it('should convert kebab-case to camelCase', () => {
			const ast = createTestAst();
			const utils = createPluginUtils(ast);

			expect(utils.toCamelCase('hello-world')).toBe('helloWorld');
			expect(utils.toCamelCase('user-profile-data')).toBe('userProfileData');
		});

		it('should convert PascalCase to camelCase', () => {
			const ast = createTestAst();
			const utils = createPluginUtils(ast);

			expect(utils.toCamelCase('HelloWorld')).toBe('helloWorld');
			expect(utils.toCamelCase('UserProfile')).toBe('userProfile');
		});

		it('should handle single words', () => {
			const ast = createTestAst();
			const utils = createPluginUtils(ast);

			expect(utils.toCamelCase('hello')).toBe('hello');
			expect(utils.toCamelCase('User')).toBe('user');
		});

		it('should handle already camelCase', () => {
			const ast = createTestAst();
			const utils = createPluginUtils(ast);

			expect(utils.toCamelCase('helloWorld')).toBe('helloWorld');
			expect(utils.toCamelCase('userProfile')).toBe('userProfile');
		});

		it('should handle empty string', () => {
			const ast = createTestAst();
			const utils = createPluginUtils(ast);

			expect(utils.toCamelCase('')).toBe('');
		});
	});

	describe('toSnakeCase', () => {
		it('should convert PascalCase to snake_case', () => {
			const ast = createTestAst();
			const utils = createPluginUtils(ast);

			expect(utils.toSnakeCase('HelloWorld')).toBe('hello_world');
			expect(utils.toSnakeCase('UserProfileData')).toBe('user_profile_data');
		});

		it('should convert camelCase to snake_case', () => {
			const ast = createTestAst();
			const utils = createPluginUtils(ast);

			expect(utils.toSnakeCase('helloWorld')).toBe('hello_world');
			expect(utils.toSnakeCase('userProfileData')).toBe('user_profile_data');
		});

		it('should convert kebab-case to snake_case', () => {
			const ast = createTestAst();
			const utils = createPluginUtils(ast);

			expect(utils.toSnakeCase('hello-world')).toBe('hello_world');
			expect(utils.toSnakeCase('user-profile')).toBe('user_profile');
		});

		it('should convert space separated to snake_case', () => {
			const ast = createTestAst();
			const utils = createPluginUtils(ast);

			expect(utils.toSnakeCase('hello world')).toBe('hello_world');
		});

		it('should handle already snake_case', () => {
			const ast = createTestAst();
			const utils = createPluginUtils(ast);

			expect(utils.toSnakeCase('hello_world')).toBe('hello_world');
		});

		it('should handle single lowercase word', () => {
			const ast = createTestAst();
			const utils = createPluginUtils(ast);

			expect(utils.toSnakeCase('hello')).toBe('hello');
		});

		it('should handle empty string', () => {
			const ast = createTestAst();
			const utils = createPluginUtils(ast);

			expect(utils.toSnakeCase('')).toBe('');
		});
	});

	describe('toScreamingSnakeCase', () => {
		it('should convert PascalCase to SCREAMING_SNAKE_CASE', () => {
			const ast = createTestAst();
			const utils = createPluginUtils(ast);

			expect(utils.toScreamingSnakeCase('HelloWorld')).toBe('HELLO_WORLD');
			expect(utils.toScreamingSnakeCase('UserProfile')).toBe('USER_PROFILE');
		});

		it('should convert camelCase to SCREAMING_SNAKE_CASE', () => {
			const ast = createTestAst();
			const utils = createPluginUtils(ast);

			expect(utils.toScreamingSnakeCase('helloWorld')).toBe('HELLO_WORLD');
		});

		it('should convert kebab-case to SCREAMING_SNAKE_CASE', () => {
			const ast = createTestAst();
			const utils = createPluginUtils(ast);

			expect(utils.toScreamingSnakeCase('hello-world')).toBe('HELLO_WORLD');
		});

		it('should convert snake_case to SCREAMING_SNAKE_CASE', () => {
			const ast = createTestAst();
			const utils = createPluginUtils(ast);

			expect(utils.toScreamingSnakeCase('hello_world')).toBe('HELLO_WORLD');
		});

		it('should handle lowercase single word', () => {
			const ast = createTestAst();
			const utils = createPluginUtils(ast);

			expect(utils.toScreamingSnakeCase('hello')).toBe('HELLO');
		});
	});

	describe('toKebabCase', () => {
		it('should convert PascalCase to kebab-case', () => {
			const ast = createTestAst();
			const utils = createPluginUtils(ast);

			expect(utils.toKebabCase('HelloWorld')).toBe('hello-world');
			expect(utils.toKebabCase('UserProfile')).toBe('user-profile');
		});

		it('should convert camelCase to kebab-case', () => {
			const ast = createTestAst();
			const utils = createPluginUtils(ast);

			expect(utils.toKebabCase('helloWorld')).toBe('hello-world');
		});

		it('should convert snake_case to kebab-case', () => {
			const ast = createTestAst();
			const utils = createPluginUtils(ast);

			expect(utils.toKebabCase('hello_world')).toBe('hello-world');
		});

		it('should handle already kebab-case', () => {
			const ast = createTestAst();
			const utils = createPluginUtils(ast);

			expect(utils.toKebabCase('hello-world')).toBe('hello-world');
		});
	});

	// ============================================================================
	// Tests: Type Reference Resolution
	// ============================================================================

	describe('typeRefToString', () => {
		it('should resolve named type reference', () => {
			const ast = createTestAst();
			const utils = createPluginUtils(ast);

			const typeRef: TypeRef = { kind: 'named', id: 'User', name: 'User' };
			expect(utils.typeRefToString(typeRef)).toBe('User');
		});

		it('should resolve array type reference', () => {
			const ast = createTestAst();
			const utils = createPluginUtils(ast);

			const typeRef: TypeRef = {
				kind: 'array',
				items: { kind: 'named', id: 'User', name: 'User' },
			};
			expect(utils.typeRefToString(typeRef)).toBe('User[]');
		});

		it('should resolve nested array type reference', () => {
			const ast = createTestAst();
			const utils = createPluginUtils(ast);

			const typeRef: TypeRef = {
				kind: 'array',
				items: {
					kind: 'array',
					items: { kind: 'named', id: 'User', name: 'User' },
				},
			};
			expect(utils.typeRefToString(typeRef)).toBe('User[][]');
		});

		it('should resolve primitive string type', () => {
			const ast = createTestAst();
			const utils = createPluginUtils(ast);

			const typeRef: TypeRef = { kind: 'primitive', primitiveType: 'string' };
			expect(utils.typeRefToString(typeRef)).toBe('string');
		});

		it('should resolve primitive number type', () => {
			const ast = createTestAst();
			const utils = createPluginUtils(ast);

			const typeRef: TypeRef = { kind: 'primitive', primitiveType: 'number' };
			expect(utils.typeRefToString(typeRef)).toBe('number');
		});

		it('should resolve primitive integer type as number', () => {
			const ast = createTestAst();
			const utils = createPluginUtils(ast);

			const typeRef: TypeRef = { kind: 'primitive', primitiveType: 'integer' };
			expect(utils.typeRefToString(typeRef)).toBe('number');
		});

		it('should resolve primitive boolean type', () => {
			const ast = createTestAst();
			const utils = createPluginUtils(ast);

			const typeRef: TypeRef = { kind: 'primitive', primitiveType: 'boolean' };
			expect(utils.typeRefToString(typeRef)).toBe('boolean');
		});

		it('should resolve primitive null type', () => {
			const ast = createTestAst();
			const utils = createPluginUtils(ast);

			const typeRef: TypeRef = { kind: 'primitive', primitiveType: 'null' };
			expect(utils.typeRefToString(typeRef)).toBe('null');
		});

		it('should resolve primitive any type as unknown', () => {
			const ast = createTestAst();
			const utils = createPluginUtils(ast);

			const typeRef: TypeRef = { kind: 'primitive', primitiveType: 'any' };
			expect(utils.typeRefToString(typeRef)).toBe('unknown');
		});

		it('should resolve enum type reference', () => {
			const ast = createTestAst();
			const utils = createPluginUtils(ast);

			const typeRef: TypeRef = { kind: 'enum', id: 'Status', name: 'Status' };
			expect(utils.typeRefToString(typeRef)).toBe('Status');
		});

		it('should resolve unknown type reference', () => {
			const ast = createTestAst();
			const utils = createPluginUtils(ast);

			const typeRef: TypeRef = { kind: 'unknown' };
			expect(utils.typeRefToString(typeRef)).toBe('unknown');
		});

		it('should resolve array of primitives', () => {
			const ast = createTestAst();
			const utils = createPluginUtils(ast);

			const typeRef: TypeRef = {
				kind: 'array',
				items: { kind: 'primitive', primitiveType: 'string' },
			};
			expect(utils.typeRefToString(typeRef)).toBe('string[]');
		});

		it('should resolve array of enums', () => {
			const ast = createTestAst();
			const utils = createPluginUtils(ast);

			const typeRef: TypeRef = {
				kind: 'array',
				items: { kind: 'enum', id: 'Status', name: 'Status' },
			};
			expect(utils.typeRefToString(typeRef)).toBe('Status[]');
		});
	});

	// ============================================================================
	// Tests: Endpoint Utilities
	// ============================================================================

	describe('isQuery', () => {
		it('should return true for GET endpoints', () => {
			const ast = createTestAst();
			const utils = createPluginUtils(ast);

			const endpoint = createEndpoint({ method: 'GET', queryType: 'query' });
			expect(utils.isQuery(endpoint)).toBe(true);
		});

		it('should return false for POST endpoints', () => {
			const ast = createTestAst();
			const utils = createPluginUtils(ast);

			const endpoint = createEndpoint({ method: 'POST', queryType: 'mutation' });
			expect(utils.isQuery(endpoint)).toBe(false);
		});

		it('should return false for PUT endpoints', () => {
			const ast = createTestAst();
			const utils = createPluginUtils(ast);

			const endpoint = createEndpoint({ method: 'PUT', queryType: 'mutation' });
			expect(utils.isQuery(endpoint)).toBe(false);
		});

		it('should return false for DELETE endpoints', () => {
			const ast = createTestAst();
			const utils = createPluginUtils(ast);

			const endpoint = createEndpoint({ method: 'DELETE', queryType: 'mutation' });
			expect(utils.isQuery(endpoint)).toBe(false);
		});

		it('should return false for PATCH endpoints', () => {
			const ast = createTestAst();
			const utils = createPluginUtils(ast);

			const endpoint = createEndpoint({ method: 'PATCH', queryType: 'mutation' });
			expect(utils.isQuery(endpoint)).toBe(false);
		});
	});

	describe('isMutation', () => {
		it('should return true for POST endpoints', () => {
			const ast = createTestAst();
			const utils = createPluginUtils(ast);

			const endpoint = createEndpoint({ method: 'POST', queryType: 'mutation' });
			expect(utils.isMutation(endpoint)).toBe(true);
		});

		it('should return true for PUT endpoints', () => {
			const ast = createTestAst();
			const utils = createPluginUtils(ast);

			const endpoint = createEndpoint({ method: 'PUT', queryType: 'mutation' });
			expect(utils.isMutation(endpoint)).toBe(true);
		});

		it('should return true for DELETE endpoints', () => {
			const ast = createTestAst();
			const utils = createPluginUtils(ast);

			const endpoint = createEndpoint({ method: 'DELETE', queryType: 'mutation' });
			expect(utils.isMutation(endpoint)).toBe(true);
		});

		it('should return true for PATCH endpoints', () => {
			const ast = createTestAst();
			const utils = createPluginUtils(ast);

			const endpoint = createEndpoint({ method: 'PATCH', queryType: 'mutation' });
			expect(utils.isMutation(endpoint)).toBe(true);
		});

		it('should return false for GET endpoints', () => {
			const ast = createTestAst();
			const utils = createPluginUtils(ast);

			const endpoint = createEndpoint({ method: 'GET', queryType: 'query' });
			expect(utils.isMutation(endpoint)).toBe(false);
		});
	});

	describe('getEndpointsByTag', () => {
		it('should return endpoints matching the tag', () => {
			const endpoints = [
				createEndpoint({ id: 'pet-1', tags: ['pets'] }),
				createEndpoint({ id: 'pet-2', tags: ['pets'] }),
				createEndpoint({ id: 'user-1', tags: ['users'] }),
			];
			const ast = createTestAst(endpoints);
			const utils = createPluginUtils(ast);

			const petEndpoints = utils.getEndpointsByTag('pets');
			expect(petEndpoints).toHaveLength(2);
			expect(petEndpoints[0].id).toBe('pet-1');
			expect(petEndpoints[1].id).toBe('pet-2');
		});

		it('should return empty array when no endpoints match', () => {
			const endpoints = [
				createEndpoint({ id: 'pet-1', tags: ['pets'] }),
			];
			const ast = createTestAst(endpoints);
			const utils = createPluginUtils(ast);

			const adminEndpoints = utils.getEndpointsByTag('admin');
			expect(adminEndpoints).toHaveLength(0);
		});

		it('should handle endpoints with multiple tags', () => {
			const endpoints = [
				createEndpoint({ id: 'ep-1', tags: ['pets', 'admin'] }),
				createEndpoint({ id: 'ep-2', tags: ['users'] }),
			];
			const ast = createTestAst(endpoints);
			const utils = createPluginUtils(ast);

			const petEndpoints = utils.getEndpointsByTag('pets');
			const adminEndpoints = utils.getEndpointsByTag('admin');

			expect(petEndpoints).toHaveLength(1);
			expect(petEndpoints[0].id).toBe('ep-1');
			expect(adminEndpoints).toHaveLength(1);
			expect(adminEndpoints[0].id).toBe('ep-1');
		});

		it('should return empty array for empty AST', () => {
			const ast = createTestAst([]);
			const utils = createPluginUtils(ast);

			const endpoints = utils.getEndpointsByTag('pets');
			expect(endpoints).toHaveLength(0);
		});
	});

	// ============================================================================
	// Tests: Logger
	// ============================================================================

	describe('createLogger', () => {
		it('should create logger without prefix', () => {
			const logger = createLogger();

			expect(typeof logger.debug).toBe('function');
			expect(typeof logger.info).toBe('function');
			expect(typeof logger.warn).toBe('function');
			expect(typeof logger.error).toBe('function');
		});

		it('should create logger with prefix', () => {
			const logger = createLogger('TestPlugin');

			expect(typeof logger.debug).toBe('function');
			expect(typeof logger.info).toBe('function');
			expect(typeof logger.warn).toBe('function');
			expect(typeof logger.error).toBe('function');
		});
	});
});
