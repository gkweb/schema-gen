/**
 * API client for the petstore API
 *
 * This is a custom fetch wrapper that handles:
 * - Base URL configuration
 * - Authentication headers
 * - JSON serialization
 * - Error handling
 */

const API_BASE_URL = 'https://petstore3.swagger.io/api/v3';

interface FetchOptions {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
}

export async function apiClient<T>(path: string, options: FetchOptions = {}): Promise<T> {
  const { method = 'GET', body, headers = {} } = options;

  const fetchOptions: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  };

  // Add body for non-GET requests
  if (body !== undefined) {
    // Handle FormData separately (don't set Content-Type, let browser set it with boundary)
    if (body instanceof FormData) {
      delete (fetchOptions.headers as Record<string, string>)['Content-Type'];
      fetchOptions.body = body;
    } else {
      fetchOptions.body = JSON.stringify(body);
    }
  }

  const response = await fetch(`${API_BASE_URL}${path}`, fetchOptions);

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`API Error ${response.status}: ${errorBody}`);
  }

  // Handle empty responses (204 No Content, etc.)
  const text = await response.text();
  if (!text) {
    return undefined as T;
  }

  return JSON.parse(text) as T;
}
