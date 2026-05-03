# Quick Start

This guide walks you through generating TypeScript code from an OpenAPI specification.

## 1. Initialize Configuration

Create a configuration file in your project root:

```bash
npx schema-gen init
```

This creates `schema-gen.config.ts`:

```ts
export default {
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
```

## 2. Add Your OpenAPI Spec

Place your OpenAPI specification at the path specified in the config (default: `./openapi.yaml`).

Example `openapi.yaml`:

```yaml
openapi: 3.0.0
info:
  title: Pet Store API
  version: 1.0.0
paths:
  /pets:
    get:
      operationId: listPets
      summary: List all pets
      responses:
        '200':
          description: A list of pets
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/Pet'
    post:
      operationId: createPet
      summary: Create a pet
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CreatePetRequest'
      responses:
        '201':
          description: Pet created
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Pet'
  /pets/{petId}:
    get:
      operationId: getPet
      summary: Get a pet by ID
      parameters:
        - name: petId
          in: path
          required: true
          schema:
            type: string
      responses:
        '200':
          description: A pet
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Pet'
components:
  schemas:
    Pet:
      type: object
      required:
        - id
        - name
      properties:
        id:
          type: string
        name:
          type: string
        status:
          $ref: '#/components/schemas/PetStatus'
    PetStatus:
      type: string
      enum:
        - available
        - pending
        - sold
    CreatePetRequest:
      type: object
      required:
        - name
      properties:
        name:
          type: string
        status:
          $ref: '#/components/schemas/PetStatus'
```

## 3. Generate Code

Run the generator:

```bash
npx schema-gen generate
```

You'll see output like:

```
schema-gen v0.2.0

Using config: schema-gen.config.ts
Input: ./openapi.yaml
Output: ./src/api

✓ Generated in 45ms
```

## 4. Generated Output

Check `./src/api` for the generated files:

**types.ts**
```ts
export interface Pet {
  id: string;
  name: string;
  status?: PetStatus;
}

export interface CreatePetRequest {
  name: string;
  status?: PetStatus;
}
```

**enums.ts**
```ts
export enum PetStatus {
  Available = 'available',
  Pending = 'pending',
  Sold = 'sold',
}
```

## 5. Add React Query (Optional)

To generate React Query hooks, update your config:

```ts{2,12}
import { defineConfig } from '@schema-gen/core';
import { reactQueryV5 } from '@schema-gen/plugin-react-query-v5';

export default defineConfig({
  input: { path: './openapi.yaml' },
  output: { dir: './src/api', clean: true },
  plugins: [
    'typescript-types',
    'typescript-enums',
    reactQueryV5({
      baseUrl: '/api',
    }),
  ],
});
```

Regenerate:

```bash
npx schema-gen generate
```

This adds `hooks.ts`:

```ts
import { useQuery, useMutation } from '@tanstack/react-query';
import type { Pet, CreatePetRequest } from './types';

export const listPetsQueryKey = () => ['listPets'] as const;

export const useListPets = () => {
  return useQuery({
    queryKey: listPetsQueryKey(),
    queryFn: async () => {
      const response = await fetch('/api/pets');
      return response.json() as Promise<Pet[]>;
    },
  });
};

export const useCreatePet = () => {
  return useMutation({
    mutationFn: async (data: CreatePetRequest) => {
      const response = await fetch('/api/pets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return response.json() as Promise<Pet>;
    },
  });
};
```

## 6. Use in Your App

```tsx
import { useListPets, useCreatePet } from './api/hooks';

function PetList() {
  const { data: pets, isLoading } = useListPets();
  const createPet = useCreatePet();

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      <ul>
        {pets?.map(pet => (
          <li key={pet.id}>{pet.name}</li>
        ))}
      </ul>
      <button
        onClick={() => createPet.mutate({ name: 'New Pet' })}
      >
        Add Pet
      </button>
    </div>
  );
}
```

## Watch Mode

During development, use watch mode to regenerate on spec changes:

```bash
npx schema-gen generate --watch
```

## Next Steps

- [Configuration](/guide/configuration) - Learn about all configuration options
- [CLI Commands](/guide/cli) - Full CLI reference
- [Plugins](/plugins/) - Explore available plugins
