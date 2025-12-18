# request-paths

Generates typed path builder functions for API endpoints. Each function handles path parameter interpolation with full type safety.

## Output

**File:** `paths.ts` (configurable)

## Usage

```ts
export default defineConfig({
  plugins: ['request-paths'],
});
```

With configuration:

```ts
export default defineConfig({
  plugins: [
    {
      name: 'request-paths',
      config: {
        suffix: 'Url',
        fileName: 'urls.ts',
        includeJsDoc: false,
      },
    },
  ],
});
```

## Configuration

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `suffix` | `string` | `'Path'` | Suffix appended to function names |
| `fileName` | `string` | `'paths.ts'` | Output file name |
| `includeJsDoc` | `boolean` | `true` | Include JSDoc comments |

## Example

**Input (OpenAPI):**

```yaml
paths:
  /users:
    get:
      operationId: listUsers
      summary: List all users
  /users/{userId}:
    get:
      operationId: getUser
      summary: Get a user by ID
      parameters:
        - name: userId
          in: path
          required: true
          schema:
            type: string
  /users/{userId}/posts/{postId}:
    get:
      operationId: getUserPost
      summary: Get a specific post by a user
      parameters:
        - name: userId
          in: path
          required: true
          schema:
            type: string
        - name: postId
          in: path
          required: true
          schema:
            type: integer
```

**Output (TypeScript):**

```ts
/**
 * List all users
 * @path GET /users
 */
export const listUsersPath = () => '/users' as const;

/**
 * Get a user by ID
 * @path GET /users/{userId}
 */
export const getUserPath = (params: { userId: string }) =>
  `/users/${params.userId}` as const;

/**
 * Get a specific post by a user
 * @path GET /users/{userId}/posts/{postId}
 */
export const getUserPostPath = (params: { userId: string; postId: number }) =>
  `/users/${params.userId}/posts/${params.postId}` as const;
```

## Features

### Type-Safe Path Parameters

Path parameters are typed based on their OpenAPI schema:

```ts
// TypeScript error: Argument of type 'number' is not assignable to 'string'
getUserPath({ userId: 123 });

// Correct usage
getUserPath({ userId: '123' });
```

### Const Assertions

All path functions use `as const` for literal return types:

```ts
const path = getUserPath({ userId: '123' });
// Type: `/users/123` (literal)

// Useful for type-safe routing
type UserRoute = ReturnType<typeof getUserPath>;
```

### Tree-Shaking

Each function is exported individually, enabling tree-shaking:

```ts
// Only imports the functions you use
import { getUserPath, listUsersPath } from './paths';
```

### JSDoc Comments

By default, JSDoc comments are included with the endpoint summary and path:

```ts
/**
 * Get a user by ID
 * @path GET /users/{userId}
 */
export const getUserPath = ...
```

Disable with `includeJsDoc: false`.

## Use Cases

### Building URLs

```ts
import { getUserPath } from './api/paths';

const url = `${baseUrl}${getUserPath({ userId })}`;
```

### Type-Safe Routing

```ts
import { getUserPath, listUsersPath } from './api/paths';

const routes = {
  users: listUsersPath(),
  user: getUserPath,
} as const;
```

### Testing

```ts
import { getUserPath } from './api/paths';

expect(getUserPath({ userId: '123' })).toBe('/users/123');
```
