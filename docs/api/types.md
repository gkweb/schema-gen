# AST Types

The Abstract Syntax Tree (AST) represents a parsed OpenAPI specification in a normalized form that plugins can work with.

## Root Container

### SchemaAst

The root AST structure.

```ts
interface SchemaAst {
  info: ApiInfo;
  types: Record<string, TypeNode>;
  enums: Record<string, EnumNode>;
  endpoints: EndpointNode[];
  tags: TagNode[];
}
```

### ApiInfo

API metadata from the OpenAPI `info` object.

```ts
interface ApiInfo {
  title: string;
  version: string;
  description?: string;
}
```

### ServerInfo

Server configuration.

```ts
interface ServerInfo {
  url: string;
  description?: string;
}
```

### TagNode

Tag definition.

```ts
interface TagNode {
  name: string;
  description?: string;
}
```

## Type Definitions

### TypeNode

A schema type definition.

```ts
interface TypeNode {
  name: string;
  kind: TypeKind;
  description?: string;
  properties: PropertyNode[];
  required: string[];
}
```

### TypeKind

The kind of type.

```ts
type TypeKind =
  | 'object'
  | 'allOf'
  | 'oneOf'
  | 'anyOf'
  | 'array'
  | 'primitive';
```

### PropertyNode

A property of an object type.

```ts
interface PropertyNode {
  name: string;
  typeRef: TypeRef;
  description?: string;
  required: boolean;
  nullable: boolean;
}
```

### TypeRef

A reference to a type.

```ts
type TypeRef =
  | { kind: 'named'; name: string }
  | { kind: 'array'; items: TypeRef }
  | { kind: 'primitive'; primitiveType: string }
  | { kind: 'enum'; name: string }
  | { kind: 'unknown' };
```

### PrimitiveType

Primitive type definition.

```ts
interface PrimitiveType {
  kind: 'primitive';
  primitiveType: 'string' | 'number' | 'integer' | 'boolean' | 'null' | 'any';
  format?: string;
}
```

## Enum Definitions

### EnumNode

An enum type definition.

```ts
interface EnumNode {
  name: string;
  description?: string;
  variants: EnumVariant[];
}
```

### EnumVariant

A variant of an enum.

```ts
interface EnumVariant {
  name: string;
  value: string | number;
  description?: string;
}
```

## Endpoint Definitions

### EndpointNode

An API endpoint/operation.

```ts
interface EndpointNode {
  id: string;
  operationId?: string;
  path: string;
  method: HttpMethod;
  summary?: string;
  description?: string;
  tags: string[];
  deprecated: boolean;
  queryType: 'query' | 'mutation';
  parameters?: ParameterNode[];
  requestBody?: RequestBodyNode;
  responses?: ResponseNode[];
  security?: SecurityRequirement[];
}
```

### HttpMethod

HTTP methods.

```ts
type HttpMethod =
  | 'GET'
  | 'POST'
  | 'PUT'
  | 'PATCH'
  | 'DELETE'
  | 'HEAD'
  | 'OPTIONS'
  | 'TRACE';
```

### ParameterNode

A request parameter.

```ts
interface ParameterNode {
  name: string;
  location: 'path' | 'query' | 'header' | 'cookie';
  description?: string;
  required: boolean;
  deprecated: boolean;
  typeRef: TypeRef;
}
```

### RequestBodyNode

A request body definition.

```ts
interface RequestBodyNode {
  description?: string;
  required: boolean;
  content: MediaTypeContent[];
}
```

### ResponseNode

A response definition.

```ts
interface ResponseNode {
  statusCode: StatusCode;
  description?: string;
  content?: MediaTypeContent[];
  headers?: HeaderNode[];
}
```

### StatusCode

Response status code.

```ts
type StatusCode =
  | { code: number }
  | 'default'
  | 'range1xx'
  | 'range2xx'
  | 'range3xx'
  | 'range4xx'
  | 'range5xx';
```

### MediaTypeContent

Media type content definition.

```ts
interface MediaTypeContent {
  mediaType: string;
  typeRef?: TypeRef;
}
```

### HeaderNode

A response header.

```ts
interface HeaderNode {
  name: string;
  description?: string;
  required: boolean;
  typeRef: TypeRef;
}
```

### SecurityRequirement

Security requirement.

```ts
interface SecurityRequirement {
  name: string;
  scopes: string[];
}
```

## Output Types

### GeneratedFile

A file to be written.

```ts
interface GeneratedFile {
  path: string;
  content: string;
}
```

## Example AST

```json
{
  "info": {
    "title": "Pet Store API",
    "version": "1.0.0"
  },
  "types": {
    "Pet": {
      "name": "Pet",
      "kind": "object",
      "properties": [
        {
          "name": "id",
          "typeRef": { "kind": "primitive", "primitiveType": "string" },
          "required": true,
          "nullable": false
        },
        {
          "name": "name",
          "typeRef": { "kind": "primitive", "primitiveType": "string" },
          "required": true,
          "nullable": false
        },
        {
          "name": "status",
          "typeRef": { "kind": "enum", "name": "PetStatus" },
          "required": false,
          "nullable": false
        }
      ],
      "required": ["id", "name"]
    }
  },
  "enums": {
    "PetStatus": {
      "name": "PetStatus",
      "variants": [
        { "name": "Available", "value": "available" },
        { "name": "Pending", "value": "pending" },
        { "name": "Sold", "value": "sold" }
      ]
    }
  },
  "endpoints": [
    {
      "id": "listPets",
      "operationId": "listPets",
      "path": "/pets",
      "method": "GET",
      "summary": "List all pets",
      "tags": ["pets"],
      "deprecated": false,
      "queryType": "query",
      "parameters": [],
      "responses": [
        {
          "statusCode": { "code": 200 },
          "content": [
            {
              "mediaType": "application/json",
              "typeRef": {
                "kind": "array",
                "items": { "kind": "named", "name": "Pet" }
              }
            }
          ]
        }
      ]
    }
  ],
  "tags": [
    { "name": "pets", "description": "Pet operations" }
  ]
}
```

Use the `schema-gen ast` command to view the AST for your OpenAPI specification.
