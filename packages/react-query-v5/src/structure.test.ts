/**
 * Tests for the `output.structure` modes — verifies the react-query-v5
 * plugin emits one file per group (`flat` / `by-tag` / `by-endpoint`).
 */

import { describe, expect, it } from 'vitest';
import { reactQueryV5 } from './index';
import type { EndpointNode, SchemaAst } from '@schema-gen/plugin-sdk';
import { createPluginContext } from '@schema-gen/plugin-sdk';

function endpoint(
  operationId: string,
  method: 'GET' | 'POST',
  path: string,
  tags: string[],
): EndpointNode {
  return {
    id: operationId,
    operationId,
    method,
    path,
    tags,
    parameters: [],
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
    info: { title: 'Test', version: '1.0.0', servers: [] },
    types: {},
    enums: {},
    endpoints,
    tags: [],
  };
}

describe('output.structure', () => {
  const endpoints = [
    endpoint('listPets', 'GET', '/pets', ['pets']),
    endpoint('createPet', 'POST', '/pets', ['pets']),
    endpoint('listOrders', 'GET', '/orders', ['orders']),
    endpoint('untaggedThing', 'GET', '/x', []),
  ];

  it('flat (default) emits a single hooks.ts', async () => {
    const plugin = reactQueryV5();
    const ctx = createPluginContext(ast(endpoints));
    const files = await plugin.emit!(ctx);

    expect(files.map((f) => f.path)).toEqual(['hooks.ts']);
    expect(files[0].content).toContain('useListPets');
    expect(files[0].content).toContain('useCreatePet');
    expect(files[0].content).toContain('useListOrders');
    expect(files[0].content).toContain('useUntaggedThing');
  });

  it('by-tag emits one file per tag and groups untagged into default.ts', async () => {
    const plugin = reactQueryV5();
    const ctx = createPluginContext(ast(endpoints), { outputStructure: 'by-tag' });
    const files = await plugin.emit!(ctx);

    const paths = files.map((f) => f.path).sort();
    expect(paths).toEqual(['default.ts', 'orders.ts', 'pets.ts']);

    const pets = files.find((f) => f.path === 'pets.ts')!;
    expect(pets.content).toContain('useListPets');
    expect(pets.content).toContain('useCreatePet');
    expect(pets.content).not.toContain('useListOrders');

    const orders = files.find((f) => f.path === 'orders.ts')!;
    expect(orders.content).toContain('useListOrders');
    expect(orders.content).not.toContain('useListPets');

    const fallback = files.find((f) => f.path === 'default.ts')!;
    expect(fallback.content).toContain('useUntaggedThing');
  });

  it('by-endpoint emits one file per generated operation', async () => {
    const plugin = reactQueryV5();
    const ctx = createPluginContext(ast(endpoints), { outputStructure: 'by-endpoint' });
    const files = await plugin.emit!(ctx);

    const paths = files.map((f) => f.path).sort();
    expect(paths).toEqual([
      'create-pet.ts',
      'list-orders.ts',
      'list-pets.ts',
      'untagged-thing.ts',
    ]);

    expect(files.find((f) => f.path === 'list-pets.ts')!.content).toContain('useListPets');
    expect(files.find((f) => f.path === 'create-pet.ts')!.content).toContain('useCreatePet');
  });

  it('skipped endpoints do not produce empty files in by-endpoint mode', async () => {
    const plugin = reactQueryV5({ overrides: { listOrders: { skip: true } } });
    const ctx = createPluginContext(ast(endpoints), { outputStructure: 'by-endpoint' });
    const files = await plugin.emit!(ctx);

    expect(files.map((f) => f.path)).not.toContain('list-orders.ts');
  });

  it('by-tag drops a tag entirely if all of its endpoints are skipped', async () => {
    const plugin = reactQueryV5({
      overrides: { listOrders: { skip: true } },
    });
    const ctx = createPluginContext(ast(endpoints), { outputStructure: 'by-tag' });
    const files = await plugin.emit!(ctx);

    expect(files.map((f) => f.path)).not.toContain('orders.ts');
  });
});
