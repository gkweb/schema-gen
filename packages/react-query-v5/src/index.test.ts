/**
 * React Query v5 Plugin Tests
 *
 * Comprehensive test coverage for the react-query-v5 plugin including:
 * - Query generation
 * - Mutation generation
 * - Custom fetch override
 * - Operation overrides
 * - Configuration options
 */

import { describe, it, expect } from 'vitest';
import { reactQueryV5 } from './index';
import type { SchemaAst, EndpointNode, ParameterNode, TypeRef } from '@schema-gen/plugin-sdk';
import { createPluginContext } from '@schema-gen/plugin-sdk';

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
 * Create a GET endpoint (query)
 */
function createQueryEndpoint(overrides: Partial<EndpointNode> = {}): EndpointNode {
  return {
    id: 'get-pets',
    operationId: 'listPets',
    method: 'GET',
    path: '/pets',
    summary: 'List all pets',
    tags: ['pets'],
    parameters: [],
    responses: [
      {
        statusCode: { code: 200 },
        content: [
          {
            mediaType: 'application/json',
            typeRef: { kind: 'named', id: 'Pet', name: 'Pet' },
          },
        ],
        headers: [],
      },
    ],
    security: [],
    deprecated: false,
    queryType: 'query',
    ...overrides,
  };
}

/**
 * Create a POST endpoint (mutation)
 */
function createMutationEndpoint(overrides: Partial<EndpointNode> = {}): EndpointNode {
  return {
    id: 'create-pet',
    operationId: 'createPet',
    method: 'POST',
    path: '/pets',
    summary: 'Create a pet',
    tags: ['pets'],
    parameters: [],
    requestBody: {
      required: true,
      content: [
        {
          mediaType: 'application/json',
          typeRef: { kind: 'named', id: 'CreatePetRequest', name: 'CreatePetRequest' },
        },
      ],
    },
    responses: [
      {
        statusCode: { code: 201 },
        content: [
          {
            mediaType: 'application/json',
            typeRef: { kind: 'named', id: 'Pet', name: 'Pet' },
          },
        ],
        headers: [],
      },
    ],
    security: [],
    deprecated: false,
    queryType: 'mutation',
    ...overrides,
  };
}

/**
 * Create a path parameter
 */
function createPathParam(
  name: string,
  typeRef: TypeRef = { kind: 'primitive', primitiveType: 'string' },
): ParameterNode {
  return {
    name,
    location: 'path',
    typeRef,
    required: true,
    deprecated: false,
    explode: false,
  };
}

/**
 * Create a query parameter
 */
function createQueryParam(
  name: string,
  required: boolean = false,
  typeRef: TypeRef = { kind: 'primitive', primitiveType: 'string' },
): ParameterNode {
  return {
    name,
    location: 'query',
    typeRef,
    required,
    deprecated: false,
    explode: false,
  };
}

// ============================================================================
// Tests: Basic Query Generation
// ============================================================================

describe('reactQueryV5 Plugin', () => {
  describe('Query Generation', () => {
    it('should generate basic useQuery hook for GET endpoint', () => {
      const endpoint = createQueryEndpoint();
      const ast = createTestAst([endpoint]);
      const plugin = reactQueryV5();
      const ctx = createPluginContext(ast);

      const files = plugin.emit!(ctx);

      expect(files).toHaveLength(1);
      expect(files[0].path).toBe('hooks.ts');
      expect(files[0].content).toContain('useQuery');
      expect(files[0].content).toContain('useListPets');
      expect(files[0].content).toContain('getListPetsQueryKey');
      expect(files[0].content).toContain('getListPetsQueryOptions');
    });

    it('should generate query key function', () => {
      const endpoint = createQueryEndpoint();
      const ast = createTestAst([endpoint]);
      const plugin = reactQueryV5();
      const ctx = createPluginContext(ast);

      const files = plugin.emit!(ctx);
      const content = files[0].content;

      expect(content).toContain("export const getListPetsQueryKey = () => ['listPets'] as const;");
      expect(content).toContain(
        'export type ListPetsQueryKey = ReturnType<typeof getListPetsQueryKey>;',
      );
    });

    it('should generate query with path parameters', () => {
      const endpoint = createQueryEndpoint({
        id: 'get-pet',
        operationId: 'getPet',
        path: '/pets/{petId}',
        parameters: [createPathParam('petId')],
      });
      const ast = createTestAst([endpoint]);
      const plugin = reactQueryV5();
      const ctx = createPluginContext(ast);

      const files = plugin.emit!(ctx);
      const content = files[0].content;

      expect(content).toContain('export interface GetPetParams');
      expect(content).toContain('petId: string;');
      expect(content).toContain('params: GetPetParams');
    });

    it('should generate query with query parameters', () => {
      const endpoint = createQueryEndpoint({
        parameters: [
          createQueryParam('limit', false, { kind: 'primitive', primitiveType: 'integer' }),
          createQueryParam('status', false),
        ],
      });
      const ast = createTestAst([endpoint]);
      const plugin = reactQueryV5();
      const ctx = createPluginContext(ast);

      const files = plugin.emit!(ctx);
      const content = files[0].content;

      expect(content).toContain('export interface ListPetsParams');
      expect(content).toContain('limit?: number;');
      expect(content).toContain('status?: string;');
      expect(content).toContain('searchParams');
    });

    it('should handle array response types', () => {
      const endpoint = createQueryEndpoint({
        responses: [
          {
            statusCode: { code: 200 },
            content: [
              {
                mediaType: 'application/json',
                typeRef: {
                  kind: 'array',
                  items: { kind: 'named', id: 'Pet', name: 'Pet' },
                },
              },
            ],
            headers: [],
          },
        ],
      });
      const ast = createTestAst([endpoint]);
      const plugin = reactQueryV5();
      const ctx = createPluginContext(ast);

      const files = plugin.emit!(ctx);
      const content = files[0].content;

      expect(content).toContain('Pet[]');
    });

    it('should use queryOptions helper from react-query v5', () => {
      const endpoint = createQueryEndpoint();
      const ast = createTestAst([endpoint]);
      const plugin = reactQueryV5();
      const ctx = createPluginContext(ast);

      const files = plugin.emit!(ctx);
      const content = files[0].content;

      expect(content).toContain('queryOptions({');
      expect(content).toContain('useQuery');
      expect(content).toContain('queryOptions');
      expect(content).toContain("from '@tanstack/react-query'");
    });
  });

  // ============================================================================
  // Tests: Mutation Generation
  // ============================================================================

  describe('Mutation Generation', () => {
    it('should generate basic useMutation hook for POST endpoint', () => {
      const endpoint = createMutationEndpoint();
      const ast = createTestAst([endpoint]);
      const plugin = reactQueryV5();
      const ctx = createPluginContext(ast);

      const files = plugin.emit!(ctx);
      const content = files[0].content;

      expect(content).toContain('useMutation');
      expect(content).toContain('useCreatePet');
      expect(content).toContain('CreatePetVariables');
    });

    it('should generate mutation with path parameters', () => {
      const endpoint = createMutationEndpoint({
        id: 'update-pet',
        operationId: 'updatePet',
        method: 'PUT',
        path: '/pets/{petId}',
        parameters: [createPathParam('petId')],
        requestBody: {
          required: true,
          content: [
            {
              mediaType: 'application/json',
              typeRef: { kind: 'named', id: 'UpdatePetRequest', name: 'UpdatePetRequest' },
            },
          ],
        },
      });
      const ast = createTestAst([endpoint]);
      const plugin = reactQueryV5();
      const ctx = createPluginContext(ast);

      const files = plugin.emit!(ctx);
      const content = files[0].content;

      expect(content).toContain('export interface UpdatePetVariables');
      expect(content).toContain('petId: string;');
      expect(content).toContain('data: UpdatePetRequest;');
    });

    it('should generate DELETE mutation without request body', () => {
      const endpoint: EndpointNode = {
        id: 'delete-pet',
        operationId: 'deletePet',
        method: 'DELETE',
        path: '/pets/{petId}',
        tags: ['pets'],
        parameters: [createPathParam('petId')],
        responses: [
          {
            statusCode: { code: 204 },
            content: [],
            headers: [],
          },
        ],
        security: [],
        deprecated: false,
        queryType: 'mutation',
      };
      const ast = createTestAst([endpoint]);
      const plugin = reactQueryV5();
      const ctx = createPluginContext(ast);

      const files = plugin.emit!(ctx);
      const content = files[0].content;

      expect(content).toContain('useDeletePet');
      expect(content).toContain('DeletePetVariables');
      expect(content).toContain('petId: string;');
      expect(content).not.toContain('data:');
    });

    it('should use UseMutationResult return type', () => {
      const endpoint = createMutationEndpoint();
      const ast = createTestAst([endpoint]);
      const plugin = reactQueryV5();
      const ctx = createPluginContext(ast);

      const files = plugin.emit!(ctx);
      const content = files[0].content;

      expect(content).toContain('UseMutationResult<');
    });
  });

  // ============================================================================
  // Tests: fetchFn Override
  // ============================================================================

  describe('fetchFn Override', () => {
    it('should use native fetch by default', () => {
      const endpoint = createQueryEndpoint();
      const ast = createTestAst([endpoint]);
      const plugin = reactQueryV5();
      const ctx = createPluginContext(ast);

      const files = plugin.emit!(ctx);
      const content = files[0].content;

      expect(content).toContain('fetch(');
      expect(content).toContain('.then(res => res.json())');
    });

    it('should use fetchFn when provided', () => {
      const endpoint = createQueryEndpoint();
      const ast = createTestAst([endpoint]);
      const plugin = reactQueryV5({
        fetchFn: {
          from: './api-client',
          name: 'apiClient',
        },
      });
      const ctx = createPluginContext(ast);

      const files = plugin.emit!(ctx);
      const content = files[0].content;

      expect(content).toContain("import { apiClient } from './api-client';");
      expect(content).toContain('apiClient(');
      expect(content).not.toMatch(/\bfetch\(/);
    });

    it('should use fetchFn for mutations', () => {
      const endpoint = createMutationEndpoint();
      const ast = createTestAst([endpoint]);
      const plugin = reactQueryV5({
        fetchFn: {
          from: '@/lib/fetch',
          name: 'customFetch',
        },
      });
      const ctx = createPluginContext(ast);

      const files = plugin.emit!(ctx);
      const content = files[0].content;

      expect(content).toContain("import { customFetch } from '@/lib/fetch';");
      expect(content).toContain('customFetch(');
    });

    it('should pass body to fetchFn for mutations', () => {
      const endpoint = createMutationEndpoint();
      const ast = createTestAst([endpoint]);
      const plugin = reactQueryV5({
        fetchFn: {
          from: './api',
          name: 'api',
        },
      });
      const ctx = createPluginContext(ast);

      const files = plugin.emit!(ctx);
      const content = files[0].content;

      expect(content).toContain('body: vars.data');
    });

    it('should work with fetchFn and path parameters', () => {
      const endpoint = createMutationEndpoint({
        id: 'update-pet',
        operationId: 'updatePet',
        method: 'PUT',
        path: '/pets/{petId}',
        parameters: [createPathParam('petId')],
      });
      const ast = createTestAst([endpoint]);
      const plugin = reactQueryV5({
        fetchFn: {
          from: './client',
          name: 'client',
        },
      });
      const ctx = createPluginContext(ast);

      const files = plugin.emit!(ctx);
      const content = files[0].content;

      expect(content).toContain('client(`/pets/${vars.petId}`');
    });
  });

  // ============================================================================
  // Tests: Operation Overrides
  // ============================================================================

  describe('Operation Overrides', () => {
    it('should skip operations marked with skip: true', () => {
      const endpoint = createQueryEndpoint();
      const ast = createTestAst([endpoint]);
      const plugin = reactQueryV5({
        overrides: {
          listPets: { skip: true },
        },
      });
      const ctx = createPluginContext(ast);

      const files = plugin.emit!(ctx);
      const content = files[0].content;

      expect(content).not.toContain('useListPets');
      expect(content).not.toContain('getListPetsQueryKey');
    });

    it('should override response type', () => {
      const endpoint = createQueryEndpoint();
      const ast = createTestAst([endpoint]);
      const plugin = reactQueryV5({
        overrides: {
          listPets: { responseType: 'CustomPetResponse' },
        },
      });
      const ctx = createPluginContext(ast);

      const files = plugin.emit!(ctx);
      const content = files[0].content;

      expect(content).toContain('CustomPetResponse');
    });

    it('should override error type', () => {
      const endpoint = createQueryEndpoint();
      const ast = createTestAst([endpoint]);
      const plugin = reactQueryV5({
        overrides: {
          listPets: { errorType: 'ApiError' },
        },
      });
      const ctx = createPluginContext(ast);

      const files = plugin.emit!(ctx);
      const content = files[0].content;

      expect(content).toContain('ApiError');
    });

    it('should override request body type for mutations', () => {
      const endpoint = createMutationEndpoint();
      const ast = createTestAst([endpoint]);
      const plugin = reactQueryV5({
        overrides: {
          createPet: { requestBodyType: 'CustomCreatePetRequest' },
        },
      });
      const ctx = createPluginContext(ast);

      const files = plugin.emit!(ctx);
      const content = files[0].content;

      expect(content).toContain('data: CustomCreatePetRequest;');
    });

    it('should force query for mutation endpoint with forceQuery', () => {
      const endpoint = createMutationEndpoint();
      const ast = createTestAst([endpoint]);
      const plugin = reactQueryV5({
        overrides: {
          createPet: { forceQuery: true },
        },
      });
      const ctx = createPluginContext(ast);

      const files = plugin.emit!(ctx);
      const content = files[0].content;

      expect(content).toContain('useQuery');
      expect(content).toContain('getCreatePetQueryKey');
      // Check that the hook uses useQuery, not useMutation
      expect(content).toContain('return useQuery(');
      expect(content).not.toContain('return useMutation(');
    });

    it('should force mutation for query endpoint with forceMutation', () => {
      const endpoint = createQueryEndpoint();
      const ast = createTestAst([endpoint]);
      const plugin = reactQueryV5({
        overrides: {
          listPets: { forceMutation: true },
        },
      });
      const ctx = createPluginContext(ast);

      const files = plugin.emit!(ctx);
      const content = files[0].content;

      expect(content).toContain('useMutation');
      expect(content).not.toContain('getListPetsQueryKey');
    });

    it('should override params type', () => {
      const endpoint = createQueryEndpoint({
        parameters: [
          createQueryParam('limit', false, { kind: 'primitive', primitiveType: 'integer' }),
        ],
      });
      const ast = createTestAst([endpoint]);
      const plugin = reactQueryV5({
        overrides: {
          listPets: { paramsType: 'CustomListPetsParams' },
        },
      });
      const ctx = createPluginContext(ast);

      const files = plugin.emit!(ctx);
      const content = files[0].content;

      expect(content).toContain('CustomListPetsParams');
      expect(content).not.toContain('export interface ListPetsParams');
    });
  });

  // ============================================================================
  // Tests: Configuration Options
  // ============================================================================

  describe('Configuration Options', () => {
    it('should use custom file name', () => {
      const endpoint = createQueryEndpoint();
      const ast = createTestAst([endpoint]);
      const plugin = reactQueryV5({ fileName: 'api-hooks.ts' });
      const ctx = createPluginContext(ast);

      const files = plugin.emit!(ctx);

      expect(files[0].path).toBe('api-hooks.ts');
    });

    it('should disable query generation', () => {
      const queryEndpoint = createQueryEndpoint();
      const mutationEndpoint = createMutationEndpoint();
      const ast = createTestAst([queryEndpoint, mutationEndpoint]);
      const plugin = reactQueryV5({ useQuery: false });
      const ctx = createPluginContext(ast);

      const files = plugin.emit!(ctx);
      const content = files[0].content;

      expect(content).not.toContain('useListPets');
      expect(content).toContain('useCreatePet');
    });

    it('should disable mutation generation', () => {
      const queryEndpoint = createQueryEndpoint();
      const mutationEndpoint = createMutationEndpoint();
      const ast = createTestAst([queryEndpoint, mutationEndpoint]);
      const plugin = reactQueryV5({ useMutation: false });
      const ctx = createPluginContext(ast);

      const files = plugin.emit!(ctx);
      const content = files[0].content;

      expect(content).toContain('useListPets');
      expect(content).not.toContain('useCreatePet');
    });

    it('should disable query keys export', () => {
      const endpoint = createQueryEndpoint();
      const ast = createTestAst([endpoint]);
      const plugin = reactQueryV5({ exportQueryKeys: false });
      const ctx = createPluginContext(ast);

      const files = plugin.emit!(ctx);
      const content = files[0].content;

      // When disabled, the query key function should not be exported
      expect(content).not.toContain('export const getListPetsQueryKey');
      expect(content).not.toContain('export type ListPetsQueryKey');
    });

    it('should disable query options export', () => {
      const endpoint = createQueryEndpoint();
      const ast = createTestAst([endpoint]);
      const plugin = reactQueryV5({ exportQueryOptions: false });
      const ctx = createPluginContext(ast);

      const files = plugin.emit!(ctx);
      const content = files[0].content;

      // When disabled, the query options function should not be exported
      expect(content).not.toContain('export const getListPetsQueryOptions');
    });

    it('should use custom types import path', () => {
      const endpoint = createQueryEndpoint();
      const ast = createTestAst([endpoint]);
      const plugin = reactQueryV5({ typesImportPath: '@/api/types' });
      const ctx = createPluginContext(ast);

      const files = plugin.emit!(ctx);
      const content = files[0].content;

      expect(content).toContain("from '@/api/types'");
    });

    it('should add base URL to fetch calls', () => {
      const endpoint = createQueryEndpoint();
      const ast = createTestAst([endpoint]);
      const plugin = reactQueryV5({ baseUrl: 'https://api.example.com' });
      const ctx = createPluginContext(ast);

      const files = plugin.emit!(ctx);
      const content = files[0].content;

      expect(content).toContain('https://api.example.com/pets');
    });

    it('should disable JSDoc comments', () => {
      const endpoint = createQueryEndpoint({ summary: 'List all pets' });
      const ast = createTestAst([endpoint]);
      const plugin = reactQueryV5({ includeJsDoc: false });
      const ctx = createPluginContext(ast);

      const files = plugin.emit!(ctx);
      const content = files[0].content;

      expect(content).not.toContain('/**');
      expect(content).not.toContain('@path');
    });

    it('should include JSDoc comments by default', () => {
      const endpoint = createQueryEndpoint({ summary: 'List all pets' });
      const ast = createTestAst([endpoint]);
      const plugin = reactQueryV5();
      const ctx = createPluginContext(ast);

      const files = plugin.emit!(ctx);
      const content = files[0].content;

      expect(content).toContain('/**');
      expect(content).toContain('List all pets');
      expect(content).toContain('@path GET /pets');
    });
  });

  // ============================================================================
  // Tests: Import Generation
  // ============================================================================

  describe('Import Generation', () => {
    it('should import useQuery types and functions', () => {
      const endpoint = createQueryEndpoint();
      const ast = createTestAst([endpoint]);
      const plugin = reactQueryV5();
      const ctx = createPluginContext(ast);

      const files = plugin.emit!(ctx);
      const content = files[0].content;

      // Check that query-related types and functions are imported
      expect(content).toContain('UseQueryOptions');
      expect(content).toContain('UseQueryResult');
      expect(content).toContain('useQuery');
      expect(content).toContain('queryOptions');
      expect(content).toContain("from '@tanstack/react-query'");
    });

    it('should import useMutation types and functions', () => {
      const endpoint = createMutationEndpoint();
      const ast = createTestAst([endpoint]);
      const plugin = reactQueryV5();
      const ctx = createPluginContext(ast);

      const files = plugin.emit!(ctx);
      const content = files[0].content;

      // Check that mutation-related types and functions are imported
      expect(content).toContain('UseMutationOptions');
      expect(content).toContain('UseMutationResult');
      expect(content).toContain('useMutation');
      expect(content).toContain("from '@tanstack/react-query'");
    });

    it('should NOT import Vue utilities', () => {
      const endpoint = createQueryEndpoint();
      const ast = createTestAst([endpoint]);
      const plugin = reactQueryV5();
      const ctx = createPluginContext(ast);

      const files = plugin.emit!(ctx);
      const content = files[0].content;

      expect(content).not.toContain("from 'vue'");
      expect(content).not.toContain('MaybeRef');
      expect(content).not.toContain('computed');
      expect(content).not.toContain('unref');
    });

    it('should import generated types', () => {
      const endpoint = createQueryEndpoint();
      const ast = createTestAst([endpoint]);
      const plugin = reactQueryV5();
      const ctx = createPluginContext(ast);

      const files = plugin.emit!(ctx);
      const content = files[0].content;

      expect(content).toContain("import type { Pet } from './types';");
    });

    it('should import multiple types sorted alphabetically', () => {
      const endpoints = [createQueryEndpoint(), createMutationEndpoint()];
      const ast = createTestAst(endpoints);
      const plugin = reactQueryV5();
      const ctx = createPluginContext(ast);

      const files = plugin.emit!(ctx);
      const content = files[0].content;

      expect(content).toContain('CreatePetRequest, Pet');
    });
  });

  // ============================================================================
  // Tests: Edge Cases
  // ============================================================================

  describe('Edge Cases', () => {
    it('should handle endpoint without operationId', () => {
      const endpoint = createQueryEndpoint({
        operationId: undefined,
      });
      const ast = createTestAst([endpoint]);
      const plugin = reactQueryV5();
      const ctx = createPluginContext(ast);

      const files = plugin.emit!(ctx);
      const content = files[0].content;

      expect(content).toContain('useGetPets');
    });

    it('should handle endpoint without response content', () => {
      const endpoint = createQueryEndpoint({
        responses: [
          {
            statusCode: { code: 204 },
            content: [],
            headers: [],
          },
        ],
      });
      const ast = createTestAst([endpoint]);
      const plugin = reactQueryV5();
      const ctx = createPluginContext(ast);

      const files = plugin.emit!(ctx);
      const content = files[0].content;

      expect(content).toContain('unknown');
    });

    it('should handle primitive response types', () => {
      const endpoint = createQueryEndpoint({
        responses: [
          {
            statusCode: { code: 200 },
            content: [
              {
                mediaType: 'application/json',
                typeRef: { kind: 'primitive', primitiveType: 'string' },
              },
            ],
            headers: [],
          },
        ],
      });
      const ast = createTestAst([endpoint]);
      const plugin = reactQueryV5();
      const ctx = createPluginContext(ast);

      const files = plugin.emit!(ctx);
      const content = files[0].content;

      expect(content).toContain('TData = string');
    });

    it('should handle multiple endpoints', () => {
      const endpoints = [
        createQueryEndpoint(),
        createQueryEndpoint({
          id: 'get-pet',
          operationId: 'getPet',
          path: '/pets/{petId}',
          parameters: [createPathParam('petId')],
        }),
        createMutationEndpoint(),
      ];
      const ast = createTestAst(endpoints);
      const plugin = reactQueryV5();
      const ctx = createPluginContext(ast);

      const files = plugin.emit!(ctx);
      const content = files[0].content;

      expect(content).toContain('useListPets');
      expect(content).toContain('useGetPet');
      expect(content).toContain('useCreatePet');
    });

    it('should handle enum type references', () => {
      const endpoint = createQueryEndpoint({
        responses: [
          {
            statusCode: { code: 200 },
            content: [
              {
                mediaType: 'application/json',
                typeRef: { kind: 'enum', id: 'PetStatus', name: 'PetStatus' },
              },
            ],
            headers: [],
          },
        ],
      });
      const ast = createTestAst([endpoint]);
      const plugin = reactQueryV5();
      const ctx = createPluginContext(ast);

      const files = plugin.emit!(ctx);
      const content = files[0].content;

      expect(content).toContain('PetStatus');
    });

    it('should handle empty endpoints array', () => {
      const ast = createTestAst([]);
      const plugin = reactQueryV5();
      const ctx = createPluginContext(ast);

      const files = plugin.emit!(ctx);

      expect(files).toHaveLength(1);
      expect(files[0].content).toContain('// Generated by schema-gen');
    });
  });

  // ============================================================================
  // Tests: FormData Support
  // ============================================================================

  describe('FormData Support', () => {
    /**
     * Create a multipart/form-data mutation endpoint
     */
    function createFormDataEndpoint(overrides: Partial<EndpointNode> = {}): EndpointNode {
      return {
        id: 'upload-file',
        operationId: 'uploadFile',
        method: 'POST',
        path: '/files/upload',
        summary: 'Upload a file',
        tags: ['files'],
        parameters: [],
        requestBody: {
          required: true,
          content: [
            {
              mediaType: 'multipart/form-data',
              typeRef: { kind: 'named', id: 'FileUploadRequest', name: 'FileUploadRequest' },
            },
          ],
        },
        responses: [
          {
            statusCode: { code: 201 },
            content: [
              {
                mediaType: 'application/json',
                typeRef: { kind: 'named', id: 'FileUploadResponse', name: 'FileUploadResponse' },
              },
            ],
            headers: [],
          },
        ],
        security: [],
        deprecated: false,
        queryType: 'mutation',
        ...overrides,
      };
    }

    it('should use formDataFn when endpoint is multipart/form-data', () => {
      const endpoint = createFormDataEndpoint();
      const ast = createTestAst([endpoint]);
      const plugin = reactQueryV5({
        formDataFn: {
          from: './lib/form-data',
          name: 'toFormData',
        },
      });
      const ctx = createPluginContext(ast);

      const files = plugin.emit!(ctx);
      const content = files[0].content;

      expect(content).toContain("import { toFormData } from './lib/form-data';");
      expect(content).toContain('toFormData(vars.data');
      expect(content).toContain("path: '/files/upload'");
      expect(content).toContain("method: 'POST'");
      // Should NOT have Content-Type header (browser sets it for FormData)
      expect(content).not.toContain("'Content-Type': 'application/json'");
    });

    it('should use JSON.stringify for non-form-data endpoints even with formDataFn configured', () => {
      const endpoint = createMutationEndpoint(); // JSON content type
      const ast = createTestAst([endpoint]);
      const plugin = reactQueryV5({
        formDataFn: {
          from: './lib/form-data',
          name: 'toFormData',
        },
      });
      const ctx = createPluginContext(ast);

      const files = plugin.emit!(ctx);
      const content = files[0].content;

      // Should use JSON.stringify, not toFormData
      expect(content).toContain('JSON.stringify(vars.data)');
      expect(content).toContain("'Content-Type': 'application/json'");
      // Should NOT import toFormData since it's not used
      expect(content).not.toContain("import { toFormData }");
    });

    it('should use JSON for form-data endpoint when formDataFn override is false', () => {
      const endpoint = createFormDataEndpoint();
      const ast = createTestAst([endpoint]);
      const plugin = reactQueryV5({
        formDataFn: {
          from: './lib/form-data',
          name: 'toFormData',
        },
        overrides: {
          uploadFile: {
            formDataFn: false, // Force JSON even though spec says form-data
          },
        },
      });
      const ctx = createPluginContext(ast);

      const files = plugin.emit!(ctx);
      const content = files[0].content;

      // Should use JSON.stringify since override disabled formDataFn
      expect(content).toContain('JSON.stringify(vars.data)');
      expect(content).toContain("'Content-Type': 'application/json'");
      // Should NOT import toFormData since it's not used
      expect(content).not.toContain("import { toFormData }");
    });

    it('should use per-operation formDataFn override', () => {
      const endpoint = createFormDataEndpoint();
      const ast = createTestAst([endpoint]);
      const plugin = reactQueryV5({
        formDataFn: {
          from: './lib/form-data',
          name: 'toFormData',
        },
        overrides: {
          uploadFile: {
            formDataFn: {
              from: './custom/form-builder',
              name: 'buildFormData',
            },
          },
        },
      });
      const ctx = createPluginContext(ast);

      const files = plugin.emit!(ctx);
      const content = files[0].content;

      // Should use the per-operation override
      expect(content).toContain("import { buildFormData } from './custom/form-builder';");
      expect(content).toContain('buildFormData(vars.data');
      // Should NOT import the plugin-level formDataFn
      expect(content).not.toContain("import { toFormData }");
    });

    it('should work with formDataFn and fetchFn together', () => {
      const endpoint = createFormDataEndpoint();
      const ast = createTestAst([endpoint]);
      const plugin = reactQueryV5({
        fetchFn: {
          from: './api-client',
          name: 'apiClient',
        },
        formDataFn: {
          from: './lib/form-data',
          name: 'toFormData',
        },
      });
      const ctx = createPluginContext(ast);

      const files = plugin.emit!(ctx);
      const content = files[0].content;

      expect(content).toContain("import { apiClient } from './api-client';");
      expect(content).toContain("import { toFormData } from './lib/form-data';");
      expect(content).toContain('apiClient(');
      expect(content).toContain('toFormData(vars.data');
    });

    it('should work with formDataFn and path parameters', () => {
      const endpoint = createFormDataEndpoint({
        id: 'upload-user-file',
        operationId: 'uploadUserFile',
        path: '/users/{userId}/files',
        parameters: [createPathParam('userId')],
      });
      const ast = createTestAst([endpoint]);
      const plugin = reactQueryV5({
        formDataFn: {
          from: './lib/form-data',
          name: 'toFormData',
        },
      });
      const ctx = createPluginContext(ast);

      const files = plugin.emit!(ctx);
      const content = files[0].content;

      expect(content).toContain('toFormData(vars.data');
      expect(content).toContain("path: '/users/{userId}/files'");
      expect(content).toContain('`/users/${vars.userId}/files`');
    });

    it('should detect request body type from multipart/form-data content', () => {
      const endpoint = createFormDataEndpoint();
      const ast = createTestAst([endpoint]);
      const plugin = reactQueryV5({
        formDataFn: {
          from: './lib/form-data',
          name: 'toFormData',
        },
      });
      const ctx = createPluginContext(ast);

      const files = plugin.emit!(ctx);
      const content = files[0].content;

      expect(content).toContain('data: FileUploadRequest;');
      expect(content).toContain('FileUploadRequest');
    });

    it('should not import formDataFn multiple times when used by multiple endpoints', () => {
      const endpoints = [
        createFormDataEndpoint({
          id: 'upload-file-1',
          operationId: 'uploadFile1',
          path: '/files/upload1',
        }),
        createFormDataEndpoint({
          id: 'upload-file-2',
          operationId: 'uploadFile2',
          path: '/files/upload2',
        }),
      ];
      const ast = createTestAst(endpoints);
      const plugin = reactQueryV5({
        formDataFn: {
          from: './lib/form-data',
          name: 'toFormData',
        },
      });
      const ctx = createPluginContext(ast);

      const files = plugin.emit!(ctx);
      const content = files[0].content;

      // Count the number of toFormData imports - should only be 1
      const importMatches = content.match(/import { toFormData } from '.\/lib\/form-data';/g);
      expect(importMatches).toHaveLength(1);

      // Both endpoints should use toFormData
      expect(content).toContain('useUploadFile1');
      expect(content).toContain('useUploadFile2');
    });
  });

  // ============================================================================
  // Tests: Plugin Metadata
  // ============================================================================

  describe('Plugin Metadata', () => {
    it('should have correct id', () => {
      const plugin = reactQueryV5();
      expect(plugin.id).toBe('react-query-v5');
    });

    it('should have correct name', () => {
      const plugin = reactQueryV5();
      expect(plugin.name).toBe('React Query v5');
    });

    it('should have version', () => {
      const plugin = reactQueryV5();
      expect(plugin.version).toBe('1.0.0');
    });

    it('should have emit function', () => {
      const plugin = reactQueryV5();
      expect(typeof plugin.emit).toBe('function');
    });
  });

  // ============================================================================
  // Tests: React Query v5 Specific Features
  // ============================================================================

  describe('React Query v5 Specific Features', () => {
    it('should use UseQueryResult instead of UseQueryReturnType', () => {
      const endpoint = createQueryEndpoint();
      const ast = createTestAst([endpoint]);
      const plugin = reactQueryV5();
      const ctx = createPluginContext(ast);

      const files = plugin.emit!(ctx);
      const content = files[0].content;

      expect(content).toContain('UseQueryResult<');
      expect(content).not.toContain('UseQueryReturnType');
    });

    it('should use plain params instead of MaybeRef', () => {
      const endpoint = createQueryEndpoint({
        parameters: [createQueryParam('limit', false, { kind: 'primitive', primitiveType: 'integer' })],
      });
      const ast = createTestAst([endpoint]);
      const plugin = reactQueryV5();
      const ctx = createPluginContext(ast);

      const files = plugin.emit!(ctx);
      const content = files[0].content;

      expect(content).toContain('params: ListPetsParams');
      expect(content).not.toContain('MaybeRef<ListPetsParams>');
    });

    it('should generate queryOptions correctly', () => {
      const endpoint = createQueryEndpoint();
      const ast = createTestAst([endpoint]);
      const plugin = reactQueryV5();
      const ctx = createPluginContext(ast);

      const files = plugin.emit!(ctx);
      const content = files[0].content;

      expect(content).toContain('queryOptions({');
      expect(content).toContain('queryKey:');
      expect(content).toContain('queryFn:');
    });
  });
});
