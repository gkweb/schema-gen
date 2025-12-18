# Output Structure

schema-gen generates files based on your configuration. This guide explains the different output organization strategies.

## Output Strategies

The `output.structure` option controls how files are organized:

### `flat` (Default)

All files are placed in the output directory root.

```
src/api/
├── types.ts
├── enums.ts
├── constants.ts
├── paths.ts
└── hooks.ts
```

**Config:**

```ts
export default defineConfig({
  output: {
    dir: './src/api',
    structure: 'flat',
  },
  // ...
});
```

### `by-tag`

Files are organized by OpenAPI tags.

```
src/api/
├── pets/
│   ├── types.ts
│   ├── hooks.ts
│   └── index.ts
├── users/
│   ├── types.ts
│   ├── hooks.ts
│   └── index.ts
├── types.ts        # Shared types
└── index.ts        # Barrel export
```

**Config:**

```ts
export default defineConfig({
  output: {
    dir: './src/api',
    structure: 'by-tag',
  },
  // ...
});
```

### `by-endpoint`

Each endpoint gets its own directory.

```
src/api/
├── listPets/
│   ├── types.ts
│   └── hook.ts
├── createPet/
│   ├── types.ts
│   └── hook.ts
├── getPet/
│   ├── types.ts
│   └── hook.ts
└── index.ts
```

**Config:**

```ts
export default defineConfig({
  output: {
    dir: './src/api',
    structure: 'by-endpoint',
  },
  // ...
});
```

## Separate Types Directory

Use `output.types` to place type definitions in a separate directory:

```ts
export default defineConfig({
  output: {
    dir: './src/api',
    types: {
      dir: 'types',    // Relative to output.dir
      barrel: true,    // Generate index.ts
    },
  },
  // ...
});
```

**Result:**

```
src/api/
├── types/
│   ├── Pet.ts
│   ├── User.ts
│   ├── enums.ts
│   └── index.ts    # Re-exports all types
├── hooks.ts
└── paths.ts
```

This is useful when you want to:
- Import types separately from runtime code
- Share types across multiple projects
- Keep a clean separation between types and implementations

## Clean Output

Use `output.clean` to remove existing files before generation:

```ts
export default defineConfig({
  output: {
    dir: './src/api',
    clean: true,  // ⚠️ Deletes all files in output.dir
  },
  // ...
});
```

::: warning
Be careful with `clean: true` if you have hand-written files in the output directory. Consider using a dedicated directory for generated code.
:::

## Generated Files by Plugin

### Built-in Plugins

| Plugin | File(s) Generated |
|--------|-------------------|
| `typescript-types` | `types.ts` |
| `typescript-enums` | `enums.ts` |
| `constants` | `constants.ts` |
| `request-paths` | `paths.ts` |

### Official Plugins

| Plugin | File(s) Generated |
|--------|-------------------|
| `@schema-gen/plugin-react-query-v5` | `hooks.ts` |
| `@schema-gen/plugin-vue-query-v4` | `queries.ts` |

### Custom File Names

Most plugins allow customizing the output file name:

```ts
import { reactQueryV5 } from '@schema-gen/plugin-react-query-v5';

export default defineConfig({
  plugins: [
    {
      name: 'request-paths',
      config: {
        fileName: 'api-paths.ts',  // Custom file name
      },
    },
    reactQueryV5({
      fileName: 'api-hooks.ts',
    }),
  ],
});
```

## Import Paths

Generated files use relative imports by default:

```ts
// hooks.ts
import type { Pet, CreatePetRequest } from './types';
import { PetStatus } from './enums';
```

### Custom Import Paths

Some plugins allow customizing import paths:

```ts
reactQueryV5({
  typesImportPath: '@/api/types',  // Alias import
  enumsImportPath: '@/api/enums',
});
```

## Barrel Exports

When using `output.types.barrel: true`, an `index.ts` file is generated that re-exports all types:

```ts
// types/index.ts
export * from './Pet';
export * from './User';
export * from './enums';
```

This enables cleaner imports:

```ts
// Instead of:
import { Pet } from '@/api/types/Pet';
import { User } from '@/api/types/User';

// You can use:
import { Pet, User } from '@/api/types';
```

## Example: Full Project Structure

A typical project structure with schema-gen:

```
my-app/
├── openapi.yaml              # OpenAPI specification
├── schema-gen.config.ts      # Configuration
├── src/
│   ├── api/                  # Generated code
│   │   ├── types/
│   │   │   ├── Pet.ts
│   │   │   ├── User.ts
│   │   │   ├── enums.ts
│   │   │   └── index.ts
│   │   ├── hooks.ts
│   │   ├── paths.ts
│   │   └── constants.ts
│   ├── components/
│   ├── pages/
│   └── App.tsx
└── package.json
```
