/**
 * FormData builder for multipart/form-data requests
 *
 * This utility converts request body objects to FormData for file upload endpoints.
 * It handles:
 * - File objects
 * - Blob objects
 * - Primitive values (converted to strings)
 * - Arrays (appended with the same key)
 * - Nested objects (JSON stringified)
 */

interface FormDataContext {
  path: string;
  method: string;
}

export function toFormData<T extends Record<string, unknown>>(
  data: T,
  _context?: FormDataContext,
): FormData {
  const formData = new FormData();

  for (const [key, value] of Object.entries(data)) {
    if (value === undefined || value === null) {
      continue;
    }

    if (value instanceof File) {
      formData.append(key, value, value.name);
    } else if (value instanceof Blob) {
      formData.append(key, value);
    } else if (Array.isArray(value)) {
      for (const item of value) {
        if (item instanceof File) {
          formData.append(key, item, item.name);
        } else if (item instanceof Blob) {
          formData.append(key, item);
        } else if (typeof item === 'object') {
          formData.append(key, JSON.stringify(item));
        } else {
          formData.append(key, String(item));
        }
      }
    } else if (typeof value === 'object') {
      formData.append(key, JSON.stringify(value));
    } else {
      formData.append(key, String(value));
    }
  }

  return formData;
}
