/**
 * Tests for per-operation override emission — verifies the react-query-v5
 * plugin honors `overrides[opId].fetchFn`, `overrides[opId].queryOptions`,
 * and `overrides[opId].mutationOptions`, plus the plugin-level
 * `queryOptions` / `mutationOptions` defaults.
 */

import { describe, expect, it } from 'vitest';
import { reactQueryV5 } from './index';
import type { EndpointNode, SchemaAst, GeneratedFile } from '@schema-gen/plugin-sdk';
import { createPluginContext } from '@schema-gen/plugin-sdk';

function ep(
  operationId: string,
  method: 'GET' | 'POST',
  path: string,
  hasBody = false,
): EndpointNode {
  return {
    id: operationId,
    operationId,
    method,
    path,
    tags: [],
    parameters: [],
    requestBody: hasBody
      ? {
          required: true,
          content: [
            {
              mediaType: 'application/json',
              typeRef: { kind: 'primitive', primitiveType: 'string' },
            },
          ],
        }
      : undefined,
    responses: [
      {
        statusCode: { code: 200 },
        content: [
          { mediaType: 'application/json', typeRef: { kind: 'primitive', primitiveType: 'string' } },
        ],
        headers: [],
      },
    ],
    security: [],
    deprecated: false,
    queryType: method === 'GET' ? 'query' : 'mutation',
  };
}

function ast(endpoints: EndpointNode[]): SchemaAst {
  return {
    info: { title: 'T', version: '1.0.0', servers: [] },
    types: {},
    enums: {},
    endpoints,
    tags: [],
  };
}

describe('per-op fetchFn override', () => {
  it('uses the per-op fetchFn over the plugin-level default', async () => {
    const plugin = reactQueryV5({
      fetchFn: { from: './global', name: 'globalFetch' },
      overrides: {
        listPets: { fetchFn: { from: './specific', name: 'specificFetch' } },
      },
    });
    const ctx = createPluginContext(ast([ep('listPets', 'GET', '/pets')]));
    const [file] = await plugin.emit!(ctx) as GeneratedFile[];

    expect(file.content).toContain("import { specificFetch } from './specific';");
    expect(file.content).toContain('specificFetch<');
    expect(file.content).not.toContain('globalFetch<');
  });

  it('falls back to native fetch when override.fetchFn === false', async () => {
    const plugin = reactQueryV5({
      fetchFn: { from: './global', name: 'globalFetch' },
      overrides: {
        listPets: { fetchFn: false },
      },
    });
    const ctx = createPluginContext(ast([ep('listPets', 'GET', '/pets')]));
    const [file] = await plugin.emit!(ctx) as GeneratedFile[];

    // listPets uses native fetch; no globalFetch import is generated
    // because no operation references the global wrapper.
    expect(file.content).toContain('fetch(');
    expect(file.content).not.toContain('globalFetch');
  });

  it('imports both global and per-op fetchFn when both are referenced', async () => {
    const plugin = reactQueryV5({
      fetchFn: { from: './global', name: 'globalFetch' },
      overrides: {
        createPet: { fetchFn: { from: './mut-specific', name: 'mutFetch' } },
      },
    });
    const ctx = createPluginContext(
      ast([ep('listPets', 'GET', '/pets'), ep('createPet', 'POST', '/pets', true)]),
    );
    const [file] = await plugin.emit!(ctx) as GeneratedFile[];

    expect(file.content).toContain("import { globalFetch } from './global';");
    expect(file.content).toContain("import { mutFetch } from './mut-specific';");
    expect(file.content).toContain('globalFetch<');
    expect(file.content).toContain('mutFetch<');
  });
});

describe('queryOptions / mutationOptions wrappers', () => {
  it('wraps useQuery options through the plugin-level queryOptions default', async () => {
    const plugin = reactQueryV5({
      queryOptions: { from: './opts', name: 'wrapQuery' },
    });
    const ctx = createPluginContext(ast([ep('listPets', 'GET', '/pets')]));
    const [file] = await plugin.emit!(ctx) as GeneratedFile[];

    expect(file.content).toContain("import { wrapQuery } from './opts';");
    expect(file.content).toContain(
      "useQuery(wrapQuery(getListPetsQueryOptions(options), { operationId: 'listPets', method: 'GET', path: '/pets' }))",
    );
  });

  it('wraps useMutation options through the plugin-level mutationOptions default', async () => {
    const plugin = reactQueryV5({
      mutationOptions: { from: './opts', name: 'wrapMut' },
    });
    const ctx = createPluginContext(ast([ep('createPet', 'POST', '/pets', true)]));
    const [file] = await plugin.emit!(ctx) as GeneratedFile[];

    expect(file.content).toContain("import { wrapMut } from './opts';");
    expect(file.content).toContain(
      "useMutation(wrapMut({ mutationFn:",
    );
    expect(file.content).toContain(
      "{ operationId: 'createPet', method: 'POST', path: '/pets' }",
    );
  });

  it('per-op queryOptions overrides the plugin-level default for that op', async () => {
    const plugin = reactQueryV5({
      queryOptions: { from: './global-opts', name: 'globalWrap' },
      overrides: {
        listPets: { queryOptions: { from: './op-opts', name: 'opWrap' } },
      },
    });
    const ctx = createPluginContext(
      ast([ep('listPets', 'GET', '/pets'), ep('listOrders', 'GET', '/orders')]),
    );
    const [file] = await plugin.emit!(ctx) as GeneratedFile[];

    expect(file.content).toContain("import { globalWrap } from './global-opts';");
    expect(file.content).toContain("import { opWrap } from './op-opts';");
    expect(file.content).toContain(
      "useQuery(opWrap(getListPetsQueryOptions(options), { operationId: 'listPets', method: 'GET', path: '/pets' }))",
    );
    expect(file.content).toContain(
      "useQuery(globalWrap(getListOrdersQueryOptions(options), { operationId: 'listOrders', method: 'GET', path: '/orders' }))",
    );
  });

  it('emits no wrapper call when neither global nor per-op options are configured', async () => {
    const plugin = reactQueryV5();
    const ctx = createPluginContext(ast([ep('listPets', 'GET', '/pets')]));
    const [file] = await plugin.emit!(ctx) as GeneratedFile[];

    expect(file.content).toContain('useQuery(getListPetsQueryOptions(options))');
    // No opContext literal should appear
    expect(file.content).not.toContain("operationId: 'listPets'");
  });
});
