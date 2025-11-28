//! Enum definitions for the AST

use serde::{Deserialize, Serialize};

/// An enum definition node
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct EnumNode {
    /// Unique identifier for this enum
    pub id: String,

    /// PascalCase name for code generation
    pub name: String,

    /// Original name from the OpenAPI spec
    pub original_name: String,

    /// Description from the spec
    #[serde(skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,

    /// The enum variants
    pub variants: Vec<EnumVariant>,

    /// The type of values (string or integer)
    pub value_type: EnumValueType,

    /// JSON pointer to the source in the original spec
    #[serde(skip_serializing_if = "Option::is_none")]
    pub source_path: Option<String>,
}

/// A single enum variant
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct EnumVariant {
    /// SCREAMING_SNAKE_CASE name for code generation
    pub name: String,

    /// The actual value
    pub value: EnumValue,

    /// Description for this variant
    #[serde(skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,
}

/// The type of enum values
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum EnumValueType {
    /// String values
    String,
    /// Integer values
    Integer,
}

/// An enum value
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(untagged)]
pub enum EnumValue {
    /// String value
    String(String),
    /// Integer value
    Integer(i64),
}

impl EnumNode {
    /// Create a new string enum
    pub fn new_string(id: impl Into<String>, name: impl Into<String>) -> Self {
        Self {
            id: id.into(),
            name: name.into(),
            original_name: String::new(),
            description: None,
            variants: Vec::new(),
            value_type: EnumValueType::String,
            source_path: None,
        }
    }

    /// Create a new integer enum
    pub fn new_integer(id: impl Into<String>, name: impl Into<String>) -> Self {
        Self {
            id: id.into(),
            name: name.into(),
            original_name: String::new(),
            description: None,
            variants: Vec::new(),
            value_type: EnumValueType::Integer,
            source_path: None,
        }
    }

    /// Add a string variant
    pub fn add_string_variant(&mut self, name: impl Into<String>, value: impl Into<String>) {
        self.variants.push(EnumVariant {
            name: name.into(),
            value: EnumValue::String(value.into()),
            description: None,
        });
    }

    /// Add an integer variant
    pub fn add_integer_variant(&mut self, name: impl Into<String>, value: i64) {
        self.variants.push(EnumVariant {
            name: name.into(),
            value: EnumValue::Integer(value),
            description: None,
        });
    }
}

impl EnumValue {
    /// Get as string value
    pub fn as_string(&self) -> Option<&str> {
        match self {
            EnumValue::String(s) => Some(s),
            _ => None,
        }
    }

    /// Get as integer value
    pub fn as_integer(&self) -> Option<i64> {
        match self {
            EnumValue::Integer(i) => Some(*i),
            _ => None,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_enum_serialization() {
        let mut enum_node = EnumNode::new_string("Status", "Status");
        enum_node.add_string_variant("PENDING", "pending");
        enum_node.add_string_variant("ACTIVE", "active");
        enum_node.add_string_variant("INACTIVE", "inactive");

        let json = serde_json::to_string_pretty(&enum_node).unwrap();
        assert!(json.contains("PENDING"));
        assert!(json.contains("pending"));
    }
}
