---
layout: home

hero:
  name: schema-gen
  text: OpenAPI Code Generation
  tagline: High-performance TypeScript/React Query/Vue Query code generation, powered by Rust
  actions:
    - theme: brand
      text: Get Started
      link: /guide/
    - theme: alt
      text: View on GitHub
      link: https://github.com/gkweb/schema-gen

features:
  - icon:
      src: /rust.svg
      alt: Rust
    title: Blazing Fast
    details: Rust-powered parsing and transformation delivers 10-70x faster code generation than JavaScript alternatives.
  - icon:
      dark: /typescript-dark.svg
      light: /typescript.svg
    title: Type Safe
    details: Generates fully typed TypeScript code with interfaces, enums, and type-safe API clients.
  - icon:
      src: /puzzle.svg
    title: Plugin Architecture
    details: Extensible with custom TypeScript plugins. Built-in support for React Query, Vue Query, and more.
  - icon:
      src: /config.svg
    title: Simple Configuration
    details: Orval-inspired declarative configuration. Define your input, output, and plugins in a single file.
---

## Quick Install

```bash
pnpm add @schema-gen/core @schema-gen/cli
```

## Example

Generate TypeScript types and React Query hooks from your OpenAPI spec:

::: code-group

```ts [schema-gen.config.ts]
import { defineConfig } from '@schema-gen/core';

export default defineConfig({
  input: { path: './openapi.yaml' },
  output: { dir: './src/api' },
  plugins: [
    'typescript-types',
    'typescript-enums',
    '@schema-gen/plugin-react-query-v5',
  ],
});
```

```yaml [openapi.yaml]
openapi: 3.0.0
info:
  title: Pet Store API
  version: 1.0.0
paths:
  /pets:
    get:
      operationId: listPets
      responses:
        '200':
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/Pet'
components:
  schemas:
    Pet:
      type: object
      properties:
        id:
          type: integer
        name:
          type: string
```

```ts [Generated: types.ts]
export interface Pet {
  id?: number;
  name?: string;
}
```

```ts [Generated: hooks.ts]
import { useQuery } from '@tanstack/react-query';
import type { Pet } from './types';

export const useListPets = () => {
  return useQuery({
    queryKey: ['listPets'],
    queryFn: async () => {
      const response = await fetch('/pets');
      return response.json() as Promise<Pet[]>;
    },
  });
};
```

:::

Then run:

```bash
schema-gen generate
```
