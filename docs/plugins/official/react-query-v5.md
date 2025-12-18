# React Query v5

Generates TanStack React Query v5 hooks from OpenAPI specifications.

## Installation

```bash
pnpm add @schema-gen/plugin-react-query-v5 @tanstack/react-query
```

## Output

**File:** `hooks.ts` (configurable)

## Usage

```ts
import { defineConfig } from '@schema-gen/core';
import { reactQueryV5 } from '@schema-gen/plugin-react-query-v5';

export default defineConfig({
  input: { path: './openapi.yaml' },
  output: { dir: './src/api' },
  plugins: [
    'typescript-types',
    'typescript-enums',
    reactQueryV5(),
  ],
});
```

## Configuration

```ts
reactQueryV5({
  // Output file name
  fileName: 'hooks.ts',

  // Generate useQuery hooks for GET endpoints
  useQuery: true,

  // Generate useMutation hooks for non-GET endpoints
  useMutation: true,

  // Generate useInfiniteQuery hooks
  useInfiniteQuery: false,

  // Parameter name for infinite query pagination
  infiniteQueryParam: 'cursor',

  // Generate useSuspenseQuery hooks
  useSuspenseQuery: false,

  // Export query key generator functions
  exportQueryKeys: true,

  // Export query options builder functions
  exportQueryOptions: true,

  // Use operationId as query key base (vs path)
  useOperationIdAsQueryKey: true,

  // Include JSDoc comments
  includeJsDoc: true,

  // Base URL for API calls
  baseUrl: '/api',

  // Import path for generated types
  typesImportPath: './types',

  // Separate import path for enums (if different)
  enumsImportPath: './enums',

  // Custom fetch function
  fetchFn: {
    from: './api-client',
    name: 'apiClient',
  },

  // FormData builder for multipart endpoints
  formDataFn: {
    from: './lib/form-data',
    name: 'toFormData',
  },

  // Per-operation overrides
  overrides: {
    getUser: {
      responseType: 'CustomUser',
    },
  },
});
```

## Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `fileName` | `string` | `'hooks.ts'` | Output file name |
| `useQuery` | `boolean` | `true` | Generate useQuery hooks |
| `useMutation` | `boolean` | `true` | Generate useMutation hooks |
| `useInfiniteQuery` | `boolean` | `false` | Generate useInfiniteQuery hooks |
| `infiniteQueryParam` | `string` | `'cursor'` | Pagination parameter name |
| `useSuspenseQuery` | `boolean` | `false` | Generate useSuspenseQuery hooks |
| `exportQueryKeys` | `boolean` | `true` | Export query key functions |
| `exportQueryOptions` | `boolean` | `true` | Export query options builders |
| `useOperationIdAsQueryKey` | `boolean` | `true` | Use operationId in query keys |
| `includeJsDoc` | `boolean` | `true` | Include JSDoc comments |
| `baseUrl` | `string` | `''` | Base URL prepended to paths |
| `typesImportPath` | `string` | `'./types'` | Import path for types |
| `enumsImportPath` | `string` | - | Import path for enums |
| `fetchFn` | `object` | - | Custom fetch function |
| `formDataFn` | `object` | - | FormData builder function |
| `overrides` | `object` | `{}` | Per-operation overrides |

## Per-Operation Overrides

| Option | Type | Description |
|--------|------|-------------|
| `responseType` | `string` | Override response type |
| `requestBodyType` | `string` | Override request body type |
| `paramsType` | `string` | Override params type |
| `errorType` | `string` | Override error type (default: `'Error'`) |
| `skip` | `boolean` | Skip generating this operation |
| `forceQuery` | `boolean` | Force as query (even if POST/PUT) |
| `forceMutation` | `boolean` | Force as mutation (even if GET) |
| `formDataFn` | `object \| false` | Override FormData handling |

## Generated Output

For each endpoint, the plugin generates:

### Query Key Function

```ts
export const getListUsersQueryKey = () => ['listUsers'] as const;

export const getGetUserQueryKey = (params: GetUserParams) =>
  ['getUser', params.userId] as const;
```

### Query Options Function

```ts
export const getListUsersQueryOptions = <TData = User[]>(
  options?: Partial<UseQueryOptions<User[], Error, TData>>
) =>
  queryOptions({
    queryKey: getListUsersQueryKey(),
    queryFn: () => fetch('/api/users').then(res => res.json()),
    ...options,
  });
```

### useQuery Hook

```ts
/**
 * List all users
 * @path GET /users
 */
export const useListUsers = <TData = User[]>(
  options?: Partial<UseQueryOptions<User[], Error, TData>>
): UseQueryResult<TData, Error> => {
  return useQuery(getListUsersQueryOptions(options));
};
```

### useMutation Hook

```ts
/**
 * Create a new user
 * @path POST /users
 */
export const useCreateUser = <TContext = unknown>(
  options?: Partial<UseMutationOptions<User, Error, CreateUserVariables, TContext>>
): UseMutationResult<User, Error, CreateUserVariables, TContext> => {
  return useMutation({
    mutationFn: (vars) => fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(vars.data),
    }).then(res => res.json()),
    ...options,
  });
};
```

## Example Usage

### Basic Query

```tsx
import { useListUsers } from './api/hooks';

function UserList() {
  const { data: users, isLoading, error } = useListUsers();

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <ul>
      {users?.map(user => (
        <li key={user.id}>{user.name}</li>
      ))}
    </ul>
  );
}
```

### Query with Parameters

```tsx
import { useGetUser } from './api/hooks';

function UserProfile({ userId }: { userId: string }) {
  const { data: user } = useGetUser({ userId });

  return <div>{user?.name}</div>;
}
```

### Mutation

```tsx
import { useCreateUser } from './api/hooks';
import { useQueryClient } from '@tanstack/react-query';
import { getListUsersQueryKey } from './api/hooks';

function CreateUserForm() {
  const queryClient = useQueryClient();
  const createUser = useCreateUser({
    onSuccess: () => {
      // Invalidate the users list
      queryClient.invalidateQueries({
        queryKey: getListUsersQueryKey(),
      });
    },
  });

  const handleSubmit = (data: CreateUserRequest) => {
    createUser.mutate({ data });
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* form fields */}
      <button disabled={createUser.isPending}>
        {createUser.isPending ? 'Creating...' : 'Create User'}
      </button>
    </form>
  );
}
```

### Prefetching (SSR)

```tsx
import { getListUsersQueryOptions } from './api/hooks';

// In your loader or getServerSideProps
export async function loader() {
  const queryClient = new QueryClient();

  await queryClient.prefetchQuery(getListUsersQueryOptions());

  return {
    dehydratedState: dehydrate(queryClient),
  };
}
```

## Custom Fetch Client

Use a custom fetch client for authentication, error handling, etc:

```ts
// api-client.ts
export async function apiClient<T>(
  url: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getToken()}`,
      ...options?.headers,
    },
  });

  if (!response.ok) {
    throw new ApiError(response.status, await response.json());
  }

  return response.json();
}
```

```ts
// schema-gen.config.ts
reactQueryV5({
  fetchFn: {
    from: './api-client',
    name: 'apiClient',
  },
});
```

## FormData Handling

For file upload endpoints using `multipart/form-data`:

```ts
// lib/form-data.ts
export function toFormData(
  data: Record<string, unknown>,
  context: { path: string; method: string }
): FormData {
  const formData = new FormData();
  for (const [key, value] of Object.entries(data)) {
    if (value instanceof File) {
      formData.append(key, value);
    } else {
      formData.append(key, String(value));
    }
  }
  return formData;
}
```

```ts
reactQueryV5({
  formDataFn: {
    from: './lib/form-data',
    name: 'toFormData',
  },
});
```
