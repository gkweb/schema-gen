/**
 * Schema-gen configuration for React Query v5 integration testing
 *
 * This configuration demonstrates all features of the react-query-v5 plugin:
 * - Basic query and mutation generation
 * - Custom fetch function integration
 * - FormData handling for file uploads
 * - Operation overrides (skip, force query/mutation, type overrides)
 * - Query key and options exports
 * - JSDoc generation
 */

import { defineConfig, plugins } from '../../packages/core/src';
import reactQueryV5 from '../../packages/react-query-v5/src';

export default defineConfig({
  input: {
    path: './petstore.yaml',
    validation: 'warn',
  },
  output: {
    dir: './src/api',
    structure: 'flat',
    clean: true,
  },
  plugins: [
    // Generate TypeScript interfaces for all schemas
    plugins.typescriptTypes({
      preferInterfaces: true,
      // Import enums from the separate enums.ts file
      enumsImportPath: './enums',
    }),

    // Generate TypeScript enums for OpenAPI enums
    plugins.typescriptEnums(),

    // Generate request path constants
    plugins.requestPaths({ suffix: 'Path' }),

    // Generate React Query v5 hooks
    reactQueryV5({
      // Output file name (default: 'hooks.ts')
      fileName: 'hooks.ts',

      // Enable all hook types
      useQuery: true,
      useMutation: true,

      // Export query key generators for cache invalidation
      exportQueryKeys: true,

      // Export query options for prefetching and SSR
      exportQueryOptions: true,

      // Include JSDoc comments with endpoint info
      includeJsDoc: true,

      // Import path for generated types
      typesImportPath: './types',

      // Import path for generated enums (separate from types)
      enumsImportPath: './enums',

      // Custom fetch function for API calls
      // This allows integration with auth, error handling, etc.
      fetchFn: {
        from: '../lib/client',
        name: 'apiClient',
      },

      // FormData builder for file upload endpoints
      formDataFn: {
        from: '../lib/form-data',
        name: 'toFormData',
      },

      // Per-operation overrides
      overrides: {
        // Example: Override error type for specific operation
        // addPet: {
        //   errorType: 'ApiError',
        // },
      },
    }),
  ],
  style: {
    semi: true,
    quotes: 'single',
    trailingComma: 'all',
  },
});
