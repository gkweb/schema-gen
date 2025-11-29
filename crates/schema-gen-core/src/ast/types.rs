//! Type definitions for the AST

use serde::{Deserialize, Serialize};

/// A type definition node
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TypeNode {
    /// Unique identifier for this type
    pub id: String,

    /// PascalCase name for code generation
    pub name: String,

    /// Original name from the OpenAPI spec
    pub original_name: String,

    /// Description from the spec
    #[serde(skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,

    /// The kind of type
    pub kind: TypeKind,

    /// Whether this type is nullable
    #[serde(default)]
    pub nullable: bool,

    /// Whether this type is deprecated
    #[serde(default)]
    pub deprecated: bool,

    /// JSON pointer to the source in the original spec
    #[serde(skip_serializing_if = "Option::is_none")]
    pub source_path: Option<String>,
}

/// The kind of type (object, array, union, etc.)
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "camelCase")]
pub enum TypeKind {
    /// Object type with properties
    Object {
        /// Object properties
        properties: Vec<PropertyNode>,
        /// Required property names
        #[serde(default)]
        required: Vec<String>,
        /// Whether additional properties are allowed
        #[serde(default)]
        additional_properties: bool,
    },

    /// Array type
    Array {
        /// The type of items in the array
        items: Box<TypeRef>,
    },

    /// Union type (anyOf/oneOf)
    Union {
        /// The variant types
        variants: Vec<TypeRef>,
        /// Discriminator property name (for discriminated unions)
        #[serde(skip_serializing_if = "Option::is_none")]
        discriminator: Option<String>,
    },

    /// Intersection type (allOf)
    Intersection {
        /// The parts to intersect
        parts: Vec<TypeRef>,
    },

    /// Primitive type
    Primitive(PrimitiveType),

    /// Reference to another type
    Reference {
        /// The ID of the referenced type
        target: String,
    },
}

/// A property within an object type
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PropertyNode {
    /// Property name (camelCase for code generation)
    pub name: String,

    /// Original property name from the spec
    pub original_name: String,

    /// Property description
    #[serde(skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,

    /// The type of this property
    pub type_ref: TypeRef,

    /// Whether this property is required
    #[serde(default)]
    pub required: bool,

    /// Whether this property is nullable
    #[serde(default)]
    pub nullable: bool,

    /// Whether this property is read-only
    #[serde(default)]
    pub readonly: bool,

    /// Whether this property is deprecated
    #[serde(default)]
    pub deprecated: bool,

    /// Default value (as JSON)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub default: Option<serde_json::Value>,
}

/// A reference to a type (can be named, inline, or primitive)
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "kind", rename_all = "camelCase")]
pub enum TypeRef {
    /// Reference to a named type by ID
    Named {
        /// The ID of the referenced type
        id: String,
        /// The name of the type (for convenience)
        name: String,
    },

    /// Inline/anonymous type
    Inline(Box<TypeNode>),

    /// Array of another type
    Array {
        /// The item type
        items: Box<TypeRef>,
    },

    /// Primitive type
    Primitive(PrimitiveType),

    /// Reference to an enum
    Enum {
        /// The ID of the referenced enum
        id: String,
        /// The name of the enum (for convenience)
        name: String,
    },

    /// Unknown/any type
    Unknown,
}

/// Primitive types
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "camelCase")]
pub enum PrimitiveType {
    /// String type
    String {
        /// Format hint (e.g., "date-time", "email", "uuid")
        #[serde(skip_serializing_if = "Option::is_none")]
        format: Option<String>,
        /// Pattern regex
        #[serde(skip_serializing_if = "Option::is_none")]
        pattern: Option<String>,
        /// Minimum length
        #[serde(skip_serializing_if = "Option::is_none")]
        min_length: Option<usize>,
        /// Maximum length
        #[serde(skip_serializing_if = "Option::is_none")]
        max_length: Option<usize>,
    },

    /// Number type (float/double)
    Number {
        /// Format hint (e.g., "float", "double")
        #[serde(skip_serializing_if = "Option::is_none")]
        format: Option<String>,
        /// Minimum value
        #[serde(skip_serializing_if = "Option::is_none")]
        minimum: Option<f64>,
        /// Maximum value
        #[serde(skip_serializing_if = "Option::is_none")]
        maximum: Option<f64>,
    },

    /// Integer type
    Integer {
        /// Format hint (e.g., "int32", "int64")
        #[serde(skip_serializing_if = "Option::is_none")]
        format: Option<String>,
        /// Minimum value
        #[serde(skip_serializing_if = "Option::is_none")]
        minimum: Option<i64>,
        /// Maximum value
        #[serde(skip_serializing_if = "Option::is_none")]
        maximum: Option<i64>,
    },

    /// Boolean type
    Boolean,

    /// Null type
    Null,

    /// Any type (no validation)
    Any,
}

impl TypeRef {
    /// Create a named type reference
    pub fn named(id: impl Into<String>, name: impl Into<String>) -> Self {
        Self::Named {
            id: id.into(),
            name: name.into(),
        }
    }

    /// Create an array type reference
    pub fn array(items: TypeRef) -> Self {
        Self::Array {
            items: Box::new(items),
        }
    }

    /// Create a string primitive reference
    pub fn string() -> Self {
        Self::Primitive(PrimitiveType::String {
            format: None,
            pattern: None,
            min_length: None,
            max_length: None,
        })
    }

    /// Create a number primitive reference
    pub fn number() -> Self {
        Self::Primitive(PrimitiveType::Number {
            format: None,
            minimum: None,
            maximum: None,
        })
    }

    /// Create an integer primitive reference
    pub fn integer() -> Self {
        Self::Primitive(PrimitiveType::Integer {
            format: None,
            minimum: None,
            maximum: None,
        })
    }

    /// Create a boolean primitive reference
    pub fn boolean() -> Self {
        Self::Primitive(PrimitiveType::Boolean)
    }

    /// Create an any type reference
    pub fn any() -> Self {
        Self::Primitive(PrimitiveType::Any)
    }
}
