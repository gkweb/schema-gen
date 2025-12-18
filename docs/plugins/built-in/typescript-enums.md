# typescript-enums

Generates TypeScript enums from OpenAPI enum definitions.

## Output

**File:** `enums.ts`

## Usage

```ts
export default defineConfig({
  plugins: ['typescript-enums'],
});
```

## Example

**Input (OpenAPI):**

```yaml
components:
  schemas:
    UserRole:
      type: string
      enum:
        - admin
        - user
        - guest
    OrderStatus:
      type: string
      enum:
        - pending
        - processing
        - shipped
        - delivered
        - cancelled
```

**Output (TypeScript):**

```ts
export enum UserRole {
  Admin = 'admin',
  User = 'user',
  Guest = 'guest',
}

export enum OrderStatus {
  Pending = 'pending',
  Processing = 'processing',
  Shipped = 'shipped',
  Delivered = 'delivered',
  Cancelled = 'cancelled',
}
```

## Features

### String Enums

Most OpenAPI enums are string enums:

```yaml
Status:
  type: string
  enum: [active, inactive, pending]
```

```ts
export enum Status {
  Active = 'active',
  Inactive = 'inactive',
  Pending = 'pending',
}
```

### Integer Enums

Integer enums are also supported:

```yaml
Priority:
  type: integer
  enum: [1, 2, 3]
```

```ts
export enum Priority {
  _1 = 1,
  _2 = 2,
  _3 = 3,
}
```

### Naming Convention

Enum member names are converted to PascalCase:

| OpenAPI Value | TypeScript Name |
|---------------|-----------------|
| `user_role` | `UserRole` |
| `ACTIVE` | `Active` |
| `some-value` | `SomeValue` |
| `123` | `_123` |

## Implementation

This plugin uses the Rust core generator for maximum performance. The generation is handled natively and produces consistent output across all platforms.
