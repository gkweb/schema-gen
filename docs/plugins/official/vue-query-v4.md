# Vue Query v4

Generates TanStack Vue Query v4 composables from OpenAPI specifications.

## Installation

```bash
pnpm add @schema-gen/plugin-vue-query-v4 @tanstack/vue-query
```

## Output

**File:** `queries.ts` (configurable)

## Usage

```ts
import { defineConfig } from '@schema-gen/core';
import { vueQueryV4 } from '@schema-gen/plugin-vue-query-v4';

export default defineConfig({
  input: { path: './openapi.yaml' },
  output: { dir: './src/api' },
  plugins: [
    'typescript-types',
    'typescript-enums',
    vueQueryV4(),
  ],
});
```

## Configuration

```ts
vueQueryV4({
  // Output file name
  fileName: 'queries.ts',

  // Generate useQuery composables for GET endpoints
  useQuery: true,

  // Generate useMutation composables for non-GET endpoints
  useMutation: true,

  // Generate useInfiniteQuery composables
  useInfiniteQuery: false,

  // Parameter name for infinite query pagination
  infiniteQueryParam: 'cursor',

  // Export query key generator functions
  exportQueryKeys: true,

  // Export query options builder functions
  exportQueryOptions: true,

  // Use operationId as query key base
  useOperationIdAsQueryKey: true,

  // Include JSDoc comments
  includeJsDoc: true,

  // Base URL for API calls
  baseUrl: '/api',

  // Import path for generated types
  typesImportPath: './types',

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
| `fileName` | `string` | `'queries.ts'` | Output file name |
| `useQuery` | `boolean` | `true` | Generate useQuery composables |
| `useMutation` | `boolean` | `true` | Generate useMutation composables |
| `useInfiniteQuery` | `boolean` | `false` | Generate useInfiniteQuery composables |
| `infiniteQueryParam` | `string` | `'cursor'` | Pagination parameter name |
| `exportQueryKeys` | `boolean` | `true` | Export query key functions |
| `exportQueryOptions` | `boolean` | `true` | Export query options builders |
| `useOperationIdAsQueryKey` | `boolean` | `true` | Use operationId in query keys |
| `includeJsDoc` | `boolean` | `true` | Include JSDoc comments |
| `baseUrl` | `string` | `''` | Base URL prepended to paths |
| `typesImportPath` | `string` | `'./types'` | Import path for types |
| `fetchFn` | `object` | - | Custom fetch function |
| `formDataFn` | `object` | - | FormData builder function |
| `overrides` | `object` | `{}` | Per-operation overrides |

## Generated Output

### Vue-Specific Features

The generated code uses Vue's reactivity system:

- **MaybeRef** for reactive parameters
- **computed** query keys that update automatically
- **unref** for parameter access in fetch functions

### Query Key Function

```ts
export const getListUsersQueryKey = () => ['listUsers'] as const;

export const getGetUserQueryKey = (params: GetUserParams) =>
  ['getUser', params.userId] as const;
```

### Query Options Function (Reactive)

```ts
export const getGetUserQueryOptions = <TData = User, TError = Error>(
  params: MaybeRef<GetUserParams>,
  options?: Partial<UseQueryOptions<User, TError, TData>>
) => ({
  queryKey: computed(() => getGetUserQueryKey(unref(params))),
  queryFn: () => {
    const p = unref(params);
    return fetch(`/api/users/${p.userId}`).then(res => res.json());
  },
  ...options,
});
```

### useQuery Composable

```ts
/**
 * Get a user by ID
 * @path GET /users/{userId}
 */
export const useGetUser = <TData = User, TError = Error>(
  params: MaybeRef<GetUserParams>,
  options?: Partial<UseQueryOptions<User, TError, TData>>
): UseQueryReturnType<TData, TError> => {
  return useQuery(getGetUserQueryOptions(params, options));
};
```

### useMutation Composable

```ts
/**
 * Create a new user
 * @path POST /users
 */
export const useCreateUser = <TError = Error, TContext = unknown>(
  options?: Partial<UseMutationOptions<User, TError, CreateUserVariables, TContext>>
): UseMutationReturnType<User, TError, CreateUserVariables, TContext> => {
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

```vue
<script setup lang="ts">
import { useListUsers } from '@/api/queries';

const { data: users, isLoading, error } = useListUsers();
</script>

<template>
  <div v-if="isLoading">Loading...</div>
  <div v-else-if="error">Error: {{ error.message }}</div>
  <ul v-else>
    <li v-for="user in users" :key="user.id">
      {{ user.name }}
    </li>
  </ul>
</template>
```

### Reactive Parameters

Parameters can be refs and the query will automatically refetch:

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { useGetUser } from '@/api/queries';

const userId = ref('123');

// Query automatically refetches when userId changes
const { data: user } = useGetUser({ userId });

function selectUser(id: string) {
  userId.value = id;
}
</script>
```

### Mutation

```vue
<script setup lang="ts">
import { useCreateUser, getListUsersQueryKey } from '@/api/queries';
import { useQueryClient } from '@tanstack/vue-query';

const queryClient = useQueryClient();

const createUser = useCreateUser({
  onSuccess: () => {
    queryClient.invalidateQueries({
      queryKey: getListUsersQueryKey(),
    });
  },
});

function handleSubmit(data: CreateUserRequest) {
  createUser.mutate({ data });
}
</script>

<template>
  <form @submit.prevent="handleSubmit(formData)">
    <!-- form fields -->
    <button :disabled="createUser.isPending">
      {{ createUser.isPending ? 'Creating...' : 'Create User' }}
    </button>
  </form>
</template>
```

### Computed Parameters

```vue
<script setup lang="ts">
import { computed } from 'vue';
import { useGetUser } from '@/api/queries';

const props = defineProps<{
  userId: string;
}>();

// Computed parameters work seamlessly
const params = computed(() => ({ userId: props.userId }));
const { data: user } = useGetUser(params);
</script>
```

## Custom Fetch Client

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
vueQueryV4({
  fetchFn: {
    from: './api-client',
    name: 'apiClient',
  },
});
```

## Differences from React Query Plugin

| Feature | React Query | Vue Query |
|---------|-------------|-----------|
| Default file name | `hooks.ts` | `queries.ts` |
| Parameters | Plain objects | `MaybeRef` wrappers |
| Query keys | Direct values | `computed()` for reactive params |
| Param access | Direct | `unref()` in fetch |
| Enum imports | Separate option | Uses `typesImportPath` |
