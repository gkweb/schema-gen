//! AST (Abstract Syntax Tree) definitions for schema-gen
//!
//! This module defines the normalized intermediate representation that sits
//! between OpenAPI parsing and code generation. The AST is designed to be:
//!
//! - **Complete**: Captures all information needed for code generation
//! - **Normalized**: No OpenAPI-specific quirks, consistent structure
//! - **Serializable**: Can be output as JSON for debugging or plugin interop

mod endpoints;
mod enums;
mod types;

pub use endpoints::*;
pub use enums::*;
pub use types::*;

use indexmap::IndexMap;
use serde::{Deserialize, Serialize};

/// Root AST container for a parsed OpenAPI specification
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SchemaAst {
    /// API metadata
    pub info: ApiInfo,

    /// All type definitions (schemas)
    pub types: IndexMap<String, TypeNode>,

    /// All enum definitions
    pub enums: IndexMap<String, EnumNode>,

    /// All endpoint definitions
    pub endpoints: Vec<EndpointNode>,

    /// Tag groupings
    pub tags: Vec<TagNode>,
}

impl SchemaAst {
    /// Create a new empty AST
    pub fn new(info: ApiInfo) -> Self {
        Self {
            info,
            types: IndexMap::new(),
            enums: IndexMap::new(),
            endpoints: Vec::new(),
            tags: Vec::new(),
        }
    }

    /// Get a type by its ID
    pub fn get_type(&self, id: &str) -> Option<&TypeNode> {
        self.types.get(id)
    }

    /// Get an enum by its ID
    pub fn get_enum(&self, id: &str) -> Option<&EnumNode> {
        self.enums.get(id)
    }

    /// Get all endpoints for a specific tag
    pub fn endpoints_by_tag(&self, tag: &str) -> Vec<&EndpointNode> {
        self.endpoints
            .iter()
            .filter(|e| e.tags.contains(&tag.to_string()))
            .collect()
    }
}

/// API metadata from the OpenAPI info object
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ApiInfo {
    /// API title
    pub title: String,

    /// API version
    pub version: String,

    /// API description
    #[serde(skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,

    /// Base URL for the API
    #[serde(skip_serializing_if = "Option::is_none")]
    pub base_url: Option<String>,

    /// Server definitions
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub servers: Vec<ServerInfo>,
}

/// Server information
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ServerInfo {
    /// Server URL
    pub url: String,

    /// Server description
    #[serde(skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,
}

/// Tag grouping for endpoints
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TagNode {
    /// Tag name
    pub name: String,

    /// Tag description
    #[serde(skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_schema_ast_serialization() {
        let ast = SchemaAst::new(ApiInfo {
            title: "Test API".to_string(),
            version: "1.0.0".to_string(),
            description: Some("A test API".to_string()),
            base_url: Some("https://api.example.com".to_string()),
            servers: vec![],
        });

        let json = serde_json::to_string_pretty(&ast).unwrap();
        assert!(json.contains("Test API"));

        let parsed: SchemaAst = serde_json::from_str(&json).unwrap();
        assert_eq!(parsed.info.title, "Test API");
    }
}
