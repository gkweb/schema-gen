//! Endpoint definitions for the AST

use super::types::Extensions;
use super::TypeRef;
use indexmap::IndexMap;
use serde::{Deserialize, Serialize};

/// An endpoint (operation) definition node
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct EndpointNode {
    /// Unique identifier for this endpoint
    pub id: String,

    /// Operation ID from the spec (if provided)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub operation_id: Option<String>,

    /// HTTP method
    pub method: HttpMethod,

    /// URL path (e.g., "/users/{id}")
    pub path: String,

    /// Summary from the spec
    #[serde(skip_serializing_if = "Option::is_none")]
    pub summary: Option<String>,

    /// Description from the spec
    #[serde(skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,

    /// Tags for grouping
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub tags: Vec<String>,

    /// Path, query, header, and cookie parameters
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub parameters: Vec<ParameterNode>,

    /// Request body (if any)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub request_body: Option<RequestBodyNode>,

    /// Response definitions
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub responses: Vec<ResponseNode>,

    /// Security requirements
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub security: Vec<SecurityRequirement>,

    /// Whether this endpoint is deprecated
    #[serde(default)]
    pub deprecated: bool,

    /// Query type classification (query vs mutation)
    pub query_type: QueryType,

    /// Vendor extensions (`x-*` fields) from the operation.
    #[serde(default, skip_serializing_if = "IndexMap::is_empty")]
    pub extensions: Extensions,
}

/// HTTP method
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(rename_all = "UPPERCASE")]
pub enum HttpMethod {
    Get,
    Post,
    Put,
    Patch,
    Delete,
    Head,
    Options,
}

impl HttpMethod {
    /// Get the lowercase string representation
    pub fn as_str(&self) -> &'static str {
        match self {
            HttpMethod::Get => "get",
            HttpMethod::Post => "post",
            HttpMethod::Put => "put",
            HttpMethod::Patch => "patch",
            HttpMethod::Delete => "delete",
            HttpMethod::Head => "head",
            HttpMethod::Options => "options",
        }
    }

    /// Whether this method is typically safe (no side effects)
    pub fn is_safe(&self) -> bool {
        matches!(self, HttpMethod::Get | HttpMethod::Head | HttpMethod::Options)
    }

    /// Whether this method is typically idempotent
    pub fn is_idempotent(&self) -> bool {
        matches!(
            self,
            HttpMethod::Get
                | HttpMethod::Put
                | HttpMethod::Delete
                | HttpMethod::Head
                | HttpMethod::Options
        )
    }
}

/// Query type classification for TanStack Query
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum QueryType {
    /// Query operations (GET, HEAD, OPTIONS) - cacheable
    Query,
    /// Mutation operations (POST, PUT, PATCH, DELETE) - side effects
    Mutation,
}

impl From<HttpMethod> for QueryType {
    fn from(method: HttpMethod) -> Self {
        if method.is_safe() {
            QueryType::Query
        } else {
            QueryType::Mutation
        }
    }
}

/// A parameter (path, query, header, or cookie)
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ParameterNode {
    /// Parameter name
    pub name: String,

    /// Where the parameter is located
    pub location: ParameterLocation,

    /// Parameter description
    #[serde(skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,

    /// The type of this parameter
    pub type_ref: TypeRef,

    /// Whether this parameter is required
    #[serde(default)]
    pub required: bool,

    /// Whether this parameter is deprecated
    #[serde(default)]
    pub deprecated: bool,

    /// Parameter style (for serialization)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub style: Option<ParameterStyle>,

    /// Whether to explode arrays/objects
    #[serde(default)]
    pub explode: bool,

    /// Vendor extensions (`x-*` fields) from the parameter.
    #[serde(default, skip_serializing_if = "IndexMap::is_empty")]
    pub extensions: Extensions,
}

/// Where a parameter is located
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum ParameterLocation {
    /// In the URL path
    Path,
    /// In the query string
    Query,
    /// In a header
    Header,
    /// In a cookie
    Cookie,
}

/// How a parameter is serialized
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum ParameterStyle {
    Matrix,
    Label,
    Form,
    Simple,
    SpaceDelimited,
    PipeDelimited,
    DeepObject,
}

/// Request body definition
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RequestBodyNode {
    /// Description
    #[serde(skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,

    /// Whether the body is required
    #[serde(default)]
    pub required: bool,

    /// Content types and their schemas
    pub content: Vec<MediaTypeContent>,

    /// Vendor extensions (`x-*` fields) from the request body.
    #[serde(default, skip_serializing_if = "IndexMap::is_empty")]
    pub extensions: Extensions,
}

/// Response definition
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ResponseNode {
    /// HTTP status code
    pub status_code: StatusCode,

    /// Description
    #[serde(skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,

    /// Content types and their schemas
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub content: Vec<MediaTypeContent>,

    /// Response headers
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub headers: Vec<HeaderNode>,

    /// Vendor extensions (`x-*` fields) from the response.
    #[serde(default, skip_serializing_if = "IndexMap::is_empty")]
    pub extensions: Extensions,
}

/// HTTP status code representation
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum StatusCode {
    /// Specific status code
    Code(u16),
    /// Default response
    Default,
    /// 1xx range
    Range1xx,
    /// 2xx range
    Range2xx,
    /// 3xx range
    Range3xx,
    /// 4xx range
    Range4xx,
    /// 5xx range
    Range5xx,
}

impl StatusCode {
    /// Parse from string (e.g., "200", "2XX", "default")
    pub fn parse(s: &str) -> Self {
        match s.to_lowercase().as_str() {
            "default" => StatusCode::Default,
            "1xx" => StatusCode::Range1xx,
            "2xx" => StatusCode::Range2xx,
            "3xx" => StatusCode::Range3xx,
            "4xx" => StatusCode::Range4xx,
            "5xx" => StatusCode::Range5xx,
            _ => s
                .parse::<u16>()
                .map(StatusCode::Code)
                .unwrap_or(StatusCode::Default),
        }
    }

    /// Whether this is a success status (2xx)
    pub fn is_success(&self) -> bool {
        match self {
            StatusCode::Code(c) => (200..300).contains(c),
            StatusCode::Range2xx => true,
            _ => false,
        }
    }
}

/// Content for a specific media type
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MediaTypeContent {
    /// Media type (e.g., "application/json")
    pub media_type: String,

    /// Schema for this media type
    #[serde(skip_serializing_if = "Option::is_none")]
    pub type_ref: Option<TypeRef>,
}

/// Response header definition
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct HeaderNode {
    /// Header name
    pub name: String,

    /// Description
    #[serde(skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,

    /// The type of this header
    pub type_ref: TypeRef,

    /// Whether this header is required
    #[serde(default)]
    pub required: bool,
}

/// Security requirement
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SecurityRequirement {
    /// Security scheme name
    pub name: String,

    /// Required scopes (for OAuth2)
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub scopes: Vec<String>,
}

impl EndpointNode {
    /// Create a new endpoint
    pub fn new(method: HttpMethod, path: impl Into<String>) -> Self {
        let path = path.into();
        let id = format!("{}_{}", method.as_str(), path.replace('/', "_"));

        Self {
            id,
            operation_id: None,
            method,
            path,
            summary: None,
            description: None,
            tags: Vec::new(),
            parameters: Vec::new(),
            request_body: None,
            responses: Vec::new(),
            security: Vec::new(),
            deprecated: false,
            query_type: method.into(),
            extensions: Extensions::new(),
        }
    }

    /// Get path parameters
    pub fn path_params(&self) -> impl Iterator<Item = &ParameterNode> {
        self.parameters
            .iter()
            .filter(|p| p.location == ParameterLocation::Path)
    }

    /// Get query parameters
    pub fn query_params(&self) -> impl Iterator<Item = &ParameterNode> {
        self.parameters
            .iter()
            .filter(|p| p.location == ParameterLocation::Query)
    }

    /// Get the success response (2xx)
    pub fn success_response(&self) -> Option<&ResponseNode> {
        self.responses.iter().find(|r| r.status_code.is_success())
    }
}
