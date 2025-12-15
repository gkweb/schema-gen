/**
 * TypeScript type definitions for the AST
 *
 * These types mirror the Rust AST definitions and are used for type-safe
 * plugin development and AST manipulation in TypeScript.
 */

/**
 * Root AST container for a parsed OpenAPI specification
 */
export interface SchemaAst {
  /** API metadata */
  info: ApiInfo;
  /** All type definitions (schemas) */
  types: Record<string, TypeNode>;
  /** All enum definitions */
  enums: Record<string, EnumNode>;
  /** All endpoint definitions */
  endpoints: EndpointNode[];
  /** Tag groupings */
  tags: TagNode[];
}

/**
 * API metadata from the OpenAPI info object
 */
export interface ApiInfo {
  /** API title */
  title: string;
  /** API version */
  version: string;
  /** API description */
  description?: string;
  /** Base URL for the API */
  baseUrl?: string;
  /** Server definitions */
  servers: ServerInfo[];
}

/**
 * Server information
 */
export interface ServerInfo {
  /** Server URL */
  url: string;
  /** Server description */
  description?: string;
}

/**
 * Tag grouping for endpoints
 */
export interface TagNode {
  /** Tag name */
  name: string;
  /** Tag description */
  description?: string;
}

/**
 * A type definition node
 */
export interface TypeNode {
  /** Unique identifier for this type */
  id: string;
  /** PascalCase name for code generation */
  name: string;
  /** Original name from the OpenAPI spec */
  originalName: string;
  /** Description from the spec */
  description?: string;
  /** The kind of type */
  kind: TypeKind;
  /** Whether this type is nullable */
  nullable: boolean;
  /** Whether this type is deprecated */
  deprecated: boolean;
  /** JSON pointer to the source in the original spec */
  sourcePath?: string;
}

/**
 * The kind of type
 */
export type TypeKind =
  | {
      type: 'object';
      properties: PropertyNode[];
      required: string[];
      additionalProperties: boolean;
    }
  | { type: 'array'; items: TypeRef }
  | { type: 'union'; variants: TypeRef[]; discriminator?: string }
  | { type: 'intersection'; parts: TypeRef[] }
  | ({ type: 'primitive' } & PrimitiveType)
  | { type: 'reference'; target: string };

/**
 * A property within an object type
 */
export interface PropertyNode {
  /** Property name (camelCase for code generation) */
  name: string;
  /** Original property name from the spec */
  originalName: string;
  /** Property description */
  description?: string;
  /** The type of this property */
  typeRef: TypeRef;
  /** Whether this property is required */
  required: boolean;
  /** Whether this property is nullable */
  nullable: boolean;
  /** Whether this property is read-only */
  readonly: boolean;
  /** Whether this property is deprecated */
  deprecated: boolean;
  /** Default value */
  default?: unknown;
}

/**
 * A reference to a type
 */
export type TypeRef =
  | { kind: 'named'; id: string; name: string }
  | { kind: 'inline'; node: TypeNode }
  | { kind: 'array'; items: TypeRef }
  | ({ kind: 'primitive' } & PrimitiveType)
  | { kind: 'enum'; id: string; name: string }
  | { kind: 'unknown' };

/**
 * Primitive types
 */
export type PrimitiveType =
  | {
      primitiveType: 'string';
      format?: string;
      pattern?: string;
      minLength?: number;
      maxLength?: number;
    }
  | { primitiveType: 'number'; format?: string; minimum?: number; maximum?: number }
  | { primitiveType: 'integer'; format?: string; minimum?: number; maximum?: number }
  | { primitiveType: 'boolean' }
  | { primitiveType: 'null' }
  | { primitiveType: 'any' };

/**
 * An enum definition node
 */
export interface EnumNode {
  /** Unique identifier for this enum */
  id: string;
  /** PascalCase name for code generation */
  name: string;
  /** Original name from the OpenAPI spec */
  originalName: string;
  /** Description from the spec */
  description?: string;
  /** The enum variants */
  variants: EnumVariant[];
  /** The type of values */
  valueType: 'string' | 'integer';
  /** JSON pointer to the source in the original spec */
  sourcePath?: string;
}

/**
 * A single enum variant
 */
export interface EnumVariant {
  /** SCREAMING_SNAKE_CASE name for code generation */
  name: string;
  /** The actual value */
  value: string | number;
  /** Description for this variant */
  description?: string;
}

/**
 * An endpoint (operation) definition node
 */
export interface EndpointNode {
  /** Unique identifier for this endpoint */
  id: string;
  /** Operation ID from the spec */
  operationId?: string;
  /** HTTP method */
  method: HttpMethod;
  /** URL path */
  path: string;
  /** Summary from the spec */
  summary?: string;
  /** Description from the spec */
  description?: string;
  /** Tags for grouping */
  tags: string[];
  /** Parameters */
  parameters: ParameterNode[];
  /** Request body */
  requestBody?: RequestBodyNode;
  /** Responses */
  responses: ResponseNode[];
  /** Security requirements */
  security: SecurityRequirement[];
  /** Whether this endpoint is deprecated */
  deprecated: boolean;
  /** Query type classification */
  queryType: 'query' | 'mutation';
}

/**
 * HTTP method
 */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';

/**
 * A parameter
 */
export interface ParameterNode {
  /** Parameter name */
  name: string;
  /** Where the parameter is located */
  location: 'path' | 'query' | 'header' | 'cookie';
  /** Parameter description */
  description?: string;
  /** The type of this parameter */
  typeRef: TypeRef;
  /** Whether this parameter is required */
  required: boolean;
  /** Whether this parameter is deprecated */
  deprecated: boolean;
  /** Parameter style */
  style?: string;
  /** Whether to explode arrays/objects */
  explode: boolean;
}

/**
 * Request body definition
 */
export interface RequestBodyNode {
  /** Description */
  description?: string;
  /** Whether the body is required */
  required: boolean;
  /** Content types and their schemas */
  content: MediaTypeContent[];
}

/**
 * Response definition
 */
export interface ResponseNode {
  /** HTTP status code */
  statusCode: StatusCode;
  /** Description */
  description?: string;
  /** Content types and their schemas */
  content: MediaTypeContent[];
  /** Response headers */
  headers: HeaderNode[];
}

/**
 * HTTP status code
 */
export type StatusCode =
  | { code: number }
  | 'default'
  | 'range1xx'
  | 'range2xx'
  | 'range3xx'
  | 'range4xx'
  | 'range5xx';

/**
 * Content for a specific media type
 */
export interface MediaTypeContent {
  /** Media type */
  mediaType: string;
  /** Schema for this media type */
  typeRef?: TypeRef;
}

/**
 * Response header definition
 */
export interface HeaderNode {
  /** Header name */
  name: string;
  /** Description */
  description?: string;
  /** The type of this header */
  typeRef: TypeRef;
  /** Whether this header is required */
  required: boolean;
}

/**
 * Security requirement
 */
export interface SecurityRequirement {
  /** Security scheme name */
  name: string;
  /** Required scopes */
  scopes: string[];
}

/**
 * A generated file from a plugin
 */
export interface GeneratedFile {
  /** Output file path (relative to output directory) */
  path: string;
  /** File content */
  content: string;
  /** Skip formatting (e.g., for non-code files) */
  skipFormat?: boolean;
}
