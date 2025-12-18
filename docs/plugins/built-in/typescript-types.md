# typescript-types

Generates TypeScript interfaces and type aliases from OpenAPI schema definitions.

## Output

**File:** `types.ts`

## Usage

```ts
export default defineConfig({
  plugins: ['typescript-types'],
});
```

## Example

**Input (OpenAPI):**

```yaml
components:
  schemas:
    User:
      type: object
      required:
        - id
        - email
      properties:
        id:
          type: string
          format: uuid
        email:
          type: string
          format: email
        name:
          type: string
        role:
          $ref: '#/components/schemas/UserRole'
        createdAt:
          type: string
          format: date-time
```

**Output (TypeScript):**

```ts
export interface User {
  id: string;
  email: string;
  name?: string;
  role?: UserRole;
  createdAt?: string;
}
```

## Features

### Type Mapping

| OpenAPI Type | TypeScript Type |
|--------------|-----------------|
| `string` | `string` |
| `number`, `integer` | `number` |
| `boolean` | `boolean` |
| `array` | `T[]` |
| `object` | Interface |
| `null` | `null` |

### Format Support

| Format | TypeScript Type |
|--------|-----------------|
| `date`, `date-time` | `string` |
| `uuid` | `string` |
| `email` | `string` |
| `uri` | `string` |
| `binary` | `Blob` |

### Complex Types

**Union Types (oneOf):**

```yaml
Pet:
  oneOf:
    - $ref: '#/components/schemas/Dog'
    - $ref: '#/components/schemas/Cat'
```

```ts
export type Pet = Dog | Cat;
```

**Intersection Types (allOf):**

```yaml
Employee:
  allOf:
    - $ref: '#/components/schemas/Person'
    - type: object
      properties:
        employeeId:
          type: string
```

```ts
export type Employee = Person & {
  employeeId?: string;
};
```

**Nullable Types:**

```yaml
middleName:
  type: string
  nullable: true
```

```ts
middleName?: string | null;
```

## Implementation

This plugin uses the Rust core generator for maximum performance. The generation is handled natively and produces consistent output across all platforms.
