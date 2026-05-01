/**
 * Generator integration tests for the pre-parse transformer hook
 * (`input.transformer`) and the `onSpec` plugin lifecycle phase.
 */

import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createGenerator } from './generator';
import type { Plugin } from '@schema-gen/plugin-sdk';

const SPEC = `
openapi: "3.0.3"
info:
  title: Original Title
  version: "1.0.0"
paths:
  /widgets:
    get:
      operationId: listWidgets
      tags: [widgets]
      responses:
        "200": { description: OK }
components:
  schemas:
    Widget:
      type: object
      properties:
        id: { type: integer }
`;

let workdir: string;

beforeEach(() => {
  workdir = fs.mkdtempSync(path.join(os.tmpdir(), 'schema-gen-test-'));
  fs.writeFileSync(path.join(workdir, 'openapi.yaml'), SPEC, 'utf-8');
});

afterEach(() => {
  fs.rmSync(workdir, { recursive: true, force: true });
});

describe('input.transformer', () => {
  it('mutates the raw OpenAPI document before AST construction', async () => {
    const generator = await createGenerator({
      baseDir: workdir,
      config: {
        input: {
          path: 'openapi.yaml',
          transformer: (spec: unknown) => {
            const doc = spec as { info: { title: string } };
            doc.info.title = 'Mutated Title';
            return doc;
          },
        },
        output: { dir: 'out' },
        plugins: [],
      },
    });

    expect(generator.ast.info.title).toBe('Mutated Title');
  });

  it('supports async transformers', async () => {
    const generator = await createGenerator({
      baseDir: workdir,
      config: {
        input: {
          path: 'openapi.yaml',
          transformer: async (spec: unknown) => {
            await Promise.resolve();
            const doc = spec as { info: { title: string } };
            doc.info.title = 'Async Title';
            return doc;
          },
        },
        output: { dir: 'out' },
        plugins: [],
      },
    });

    expect(generator.ast.info.title).toBe('Async Title');
  });

  it('loads the transformer from a module path string', async () => {
    fs.writeFileSync(
      path.join(workdir, 'transformer.mjs'),
      `export default function (spec) {
         spec.info.title = 'From Module';
         return spec;
       }`,
      'utf-8',
    );

    const generator = await createGenerator({
      baseDir: workdir,
      config: {
        input: {
          path: 'openapi.yaml',
          transformer: './transformer.mjs',
        },
        output: { dir: 'out' },
        plugins: [],
      },
    });

    expect(generator.ast.info.title).toBe('From Module');
  });
});

describe('plugin onSpec hook', () => {
  it('runs after input.transformer and can mutate the document', async () => {
    const order: string[] = [];

    const onSpecPlugin: Plugin = {
      id: 'on-spec-test',
      name: 'onSpec test',
      version: '0.0.0',
      onSpec(spec: unknown) {
        order.push('plugin');
        const doc = spec as { info: { title: string } };
        doc.info.title = `${doc.info.title} + plugin`;
        return doc;
      },
    };

    const generator = await createGenerator({
      baseDir: workdir,
      config: {
        input: {
          path: 'openapi.yaml',
          transformer: (spec) => {
            order.push('user');
            (spec as { info: { title: string } }).info.title = 'user';
            return spec;
          },
        },
        output: { dir: 'out' },
        plugins: [onSpecPlugin],
      },
    });

    expect(order).toEqual(['user', 'plugin']);
    expect(generator.ast.info.title).toBe('user + plugin');
  });

  it('treats a void return as "leave the document alone"', async () => {
    const noOpPlugin: Plugin = {
      id: 'no-op',
      name: 'no-op',
      version: '0.0.0',
      onSpec() {
        // intentionally no return
      },
    };

    const generator = await createGenerator({
      baseDir: workdir,
      config: {
        input: { path: 'openapi.yaml' },
        output: { dir: 'out' },
        plugins: [noOpPlugin],
      },
    });

    expect(generator.ast.info.title).toBe('Original Title');
  });

  it('chains plugins in config-array order', async () => {
    const a: Plugin = {
      id: 'a',
      name: 'a',
      version: '0.0.0',
      onSpec(spec: unknown) {
        const doc = spec as { info: { title: string } };
        doc.info.title = 'a';
        return doc;
      },
    };
    const b: Plugin = {
      id: 'b',
      name: 'b',
      version: '0.0.0',
      onSpec(spec: unknown) {
        const doc = spec as { info: { title: string } };
        doc.info.title = `${doc.info.title}->b`;
        return doc;
      },
    };

    const generator = await createGenerator({
      baseDir: workdir,
      config: {
        input: { path: 'openapi.yaml' },
        output: { dir: 'out' },
        plugins: [a, b],
      },
    });

    expect(generator.ast.info.title).toBe('a->b');
  });

  it('skips Phase 0 entirely when no transformer or onSpec is configured', async () => {
    const generator = await createGenerator({
      baseDir: workdir,
      config: {
        input: { path: 'openapi.yaml' },
        output: { dir: 'out' },
        plugins: [],
      },
    });

    expect(generator.ast.info.title).toBe('Original Title');
  });
});
