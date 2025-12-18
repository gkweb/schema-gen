# constants

Generates constant definitions for API endpoints, including paths and HTTP methods.

## Output

**File:** `constants.ts`

## Usage

```ts
export default defineConfig({
  plugins: ['constants'],
});
```

## Example

**Input (OpenAPI):**

```yaml
paths:
  /users:
    get:
      operationId: listUsers
    post:
      operationId: createUser
  /users/{userId}:
    get:
      operationId: getUser
    delete:
      operationId: deleteUser
```

**Output (TypeScript):**

```ts
export const ENDPOINTS = {
  listUsers: {
    method: 'GET',
    path: '/users',
  },
  createUser: {
    method: 'POST',
    path: '/users',
  },
  getUser: {
    method: 'GET',
    path: '/users/{userId}',
  },
  deleteUser: {
    method: 'DELETE',
    path: '/users/{userId}',
  },
} as const;
```

## Features

### Operation ID Keys

Constants are keyed by operation ID when available:

```yaml
/pets:
  get:
    operationId: listPets
```

```ts
export const ENDPOINTS = {
  listPets: { method: 'GET', path: '/pets' },
} as const;
```

### Path Parameters

Path parameters are preserved in the path string:

```yaml
/users/{userId}/posts/{postId}:
  get:
    operationId: getUserPost
```

```ts
export const ENDPOINTS = {
  getUserPost: {
    method: 'GET',
    path: '/users/{userId}/posts/{postId}',
  },
} as const;
```

### Type Safety

The `as const` assertion provides literal types:

```ts
// Type is exactly 'GET', not string
type Method = typeof ENDPOINTS.listUsers.method;

// Type is exactly '/users', not string
type Path = typeof ENDPOINTS.listUsers.path;
```

## Use Cases

- Building URLs manually with type safety
- Creating route definitions
- Generating API documentation
- Testing and mocking

## Implementation

This plugin uses the Rust core generator for maximum performance.
