//! Schema transformation

use crate::ast::{
    EnumNode, EnumValue, EnumValueType, EnumVariant, PrimitiveType, PropertyNode, SchemaAst,
    TypeKind, TypeNode, TypeRef,
};
use crate::error::Result;
use crate::parser::RefResolver;
use openapiv3::{OpenAPI, ReferenceOr, Schema, SchemaKind, Type};
use std::collections::HashMap;

use super::normalize::to_pascal_case;

/// Context for collecting extracted enums during transformation
struct TransformContext {
    /// Extracted enums (id -> EnumNode)
    extracted_enums: HashMap<String, EnumNode>,
}

impl TransformContext {
    fn new() -> Self {
        Self {
            extracted_enums: HashMap::new(),
        }
    }
}

/// Transform all schemas from the OpenAPI spec into AST types and enums
pub fn transform_schemas(
    spec: &OpenAPI,
    _resolver: &mut RefResolver,
    ast: &mut SchemaAst,
) -> Result<()> {
    let Some(components) = &spec.components else {
        return Ok(());
    };

    let mut ctx = TransformContext::new();

    for (name, schema_ref) in &components.schemas {
        // For now, skip references and only process inline schemas
        if let ReferenceOr::Item(schema) = schema_ref {
            transform_schema(name, schema, ast, &mut ctx)?;
        }
    }

    // Add all extracted enums to the AST
    for (id, enum_node) in ctx.extracted_enums {
        ast.enums.insert(id, enum_node);
    }

    Ok(())
}

/// Transform a single schema
fn transform_schema(name: &str, schema: &Schema, ast: &mut SchemaAst, ctx: &mut TransformContext) -> Result<()> {
    let schema_data = &schema.schema_data;

    // Check if this is an enum
    if let Some(enum_node) = try_extract_enum(name, schema, None) {
        ast.enums.insert(enum_node.id.clone(), enum_node);
        return Ok(());
    }

    // Transform as a type
    let type_node = TypeNode {
        id: name.to_string(),
        name: to_pascal_case(name),
        original_name: name.to_string(),
        description: schema_data.description.clone(),
        kind: transform_schema_kind(name, &schema.schema_kind, ctx)?,
        nullable: schema_data.nullable,
        deprecated: schema_data.deprecated,
        source_path: Some(format!("#/components/schemas/{}", name)),
    };

    ast.types.insert(type_node.id.clone(), type_node);
    Ok(())
}

/// Try to extract an enum from a schema
fn try_extract_enum(name: &str, schema: &Schema, source_path: Option<String>) -> Option<EnumNode> {
    let SchemaKind::Type(Type::String(string_type)) = &schema.schema_kind else {
        return None;
    };

    if string_type.enumeration.is_empty() {
        return None;
    }

    let variants: Vec<EnumVariant> = string_type
        .enumeration
        .iter()
        .filter_map(|v| {
            v.as_ref().map(|value| EnumVariant {
                name: to_screaming_snake_case(value),
                value: EnumValue::String(value.clone()),
                description: None,
            })
        })
        .collect();

    Some(EnumNode {
        id: name.to_string(),
        name: to_pascal_case(name),
        original_name: name.to_string(),
        description: schema.schema_data.description.clone(),
        variants,
        value_type: EnumValueType::String,
        source_path: source_path.or_else(|| Some(format!("#/components/schemas/{}", name))),
    })
}

/// Try to extract an enum from a StringType (for inline properties)
fn try_extract_inline_enum(
    parent_name: &str,
    property_name: &str,
    string_type: &openapiv3::StringType,
) -> Option<EnumNode> {
    if string_type.enumeration.is_empty() {
        return None;
    }

    let enum_name = format!("{}_{}", to_pascal_case(parent_name), to_pascal_case(property_name));

    let variants: Vec<EnumVariant> = string_type
        .enumeration
        .iter()
        .filter_map(|v| {
            v.as_ref().map(|value| EnumVariant {
                name: to_screaming_snake_case(value),
                value: EnumValue::String(value.clone()),
                description: None,
            })
        })
        .collect();

    Some(EnumNode {
        id: enum_name.clone(),
        name: enum_name.clone(),
        original_name: format!("{}.{}", parent_name, property_name),
        description: None,
        variants,
        value_type: EnumValueType::String,
        source_path: Some(format!(
            "#/components/schemas/{}/properties/{}",
            parent_name, property_name
        )),
    })
}

/// Transform a SchemaKind into a TypeKind
fn transform_schema_kind(parent_name: &str, kind: &SchemaKind, ctx: &mut TransformContext) -> Result<TypeKind> {
    match kind {
        SchemaKind::Type(type_) => transform_type(parent_name, type_, ctx),
        SchemaKind::OneOf { one_of } => Ok(TypeKind::Union {
            variants: one_of.iter().map(|s| transform_reference_or_schema(parent_name, s, ctx)).collect(),
            discriminator: None,
        }),
        SchemaKind::AnyOf { any_of } => Ok(TypeKind::Union {
            variants: any_of.iter().map(|s| transform_reference_or_schema(parent_name, s, ctx)).collect(),
            discriminator: None,
        }),
        SchemaKind::AllOf { all_of } => Ok(TypeKind::Intersection {
            parts: all_of.iter().map(|s| transform_reference_or_schema(parent_name, s, ctx)).collect(),
        }),
        SchemaKind::Not { .. } => {
            // Not types are rare, treat as unknown
            Ok(TypeKind::Primitive(PrimitiveType::Any))
        }
        SchemaKind::Any(_) => Ok(TypeKind::Primitive(PrimitiveType::Any)),
    }
}

/// Transform an OpenAPI Type into a TypeKind
fn transform_type(parent_name: &str, type_: &Type, ctx: &mut TransformContext) -> Result<TypeKind> {
    match type_ {
        Type::Object(obj) => {
            let properties: Vec<PropertyNode> = obj
                .properties
                .iter()
                .map(|(name, schema_ref)| {
                    let type_ref = transform_boxed_reference_or_schema_with_enum_extraction(
                        parent_name,
                        name,
                        schema_ref,
                        ctx,
                    );
                    let required = obj.required.contains(name);

                    PropertyNode {
                        name: to_camel_case(name),
                        original_name: name.clone(),
                        description: None, // Would need to resolve schema for this
                        type_ref,
                        required,
                        nullable: false,
                        readonly: false,
                        deprecated: false,
                        default: None,
                    }
                })
                .collect();

            Ok(TypeKind::Object {
                properties,
                required: obj.required.clone(),
                additional_properties: obj.additional_properties.is_some(),
            })
        }
        Type::Array(arr) => {
            let items = arr
                .items
                .as_ref()
                .map(|i| transform_boxed_reference_or_schema(parent_name, i, ctx))
                .unwrap_or(TypeRef::any());

            Ok(TypeKind::Array {
                items: Box::new(items),
            })
        }
        Type::String(s) => Ok(TypeKind::Primitive(PrimitiveType::String {
            format: string_format_to_string(&s.format),
            pattern: s.pattern.clone(),
            min_length: s.min_length,
            max_length: s.max_length,
        })),
        Type::Number(n) => Ok(TypeKind::Primitive(PrimitiveType::Number {
            format: number_format_to_string(&n.format),
            minimum: n.minimum,
            maximum: n.maximum,
        })),
        Type::Integer(i) => Ok(TypeKind::Primitive(PrimitiveType::Integer {
            format: integer_format_to_string(&i.format),
            minimum: i.minimum.map(|m| m as i64),
            maximum: i.maximum.map(|m| m as i64),
        })),
        Type::Boolean(_) => Ok(TypeKind::Primitive(PrimitiveType::Boolean)),
    }
}

/// Convert a VariantOrUnknownOrEmpty<StringFormat> to Option<String>
fn string_format_to_string(format: &openapiv3::VariantOrUnknownOrEmpty<openapiv3::StringFormat>) -> Option<String> {
    match format {
        openapiv3::VariantOrUnknownOrEmpty::Item(f) => Some(format!("{:?}", f).to_lowercase()),
        openapiv3::VariantOrUnknownOrEmpty::Unknown(s) => Some(s.clone()),
        openapiv3::VariantOrUnknownOrEmpty::Empty => None,
    }
}

/// Convert a VariantOrUnknownOrEmpty<NumberFormat> to Option<String>
fn number_format_to_string(format: &openapiv3::VariantOrUnknownOrEmpty<openapiv3::NumberFormat>) -> Option<String> {
    match format {
        openapiv3::VariantOrUnknownOrEmpty::Item(f) => Some(format!("{:?}", f).to_lowercase()),
        openapiv3::VariantOrUnknownOrEmpty::Unknown(s) => Some(s.clone()),
        openapiv3::VariantOrUnknownOrEmpty::Empty => None,
    }
}

/// Convert a VariantOrUnknownOrEmpty<IntegerFormat> to Option<String>
fn integer_format_to_string(format: &openapiv3::VariantOrUnknownOrEmpty<openapiv3::IntegerFormat>) -> Option<String> {
    match format {
        openapiv3::VariantOrUnknownOrEmpty::Item(f) => Some(format!("{:?}", f).to_lowercase()),
        openapiv3::VariantOrUnknownOrEmpty::Unknown(s) => Some(s.clone()),
        openapiv3::VariantOrUnknownOrEmpty::Empty => None,
    }
}

/// Transform a ReferenceOr<Schema> into a TypeRef
fn transform_reference_or_schema(_parent_name: &str, schema_ref: &ReferenceOr<Schema>, ctx: &mut TransformContext) -> TypeRef {
    match schema_ref {
        ReferenceOr::Reference { reference } => {
            let name = RefResolver::extract_schema_name(reference).unwrap_or("Unknown");
            TypeRef::named(name, to_pascal_case(name))
        }
        ReferenceOr::Item(schema) => transform_schema_to_type_ref(_parent_name, schema, ctx),
    }
}

/// Transform a ReferenceOr<Box<Schema>> into a TypeRef
fn transform_boxed_reference_or_schema(_parent_name: &str, schema_ref: &ReferenceOr<Box<Schema>>, ctx: &mut TransformContext) -> TypeRef {
    match schema_ref {
        ReferenceOr::Reference { reference } => {
            let name = RefResolver::extract_schema_name(reference).unwrap_or("Unknown");
            TypeRef::named(name, to_pascal_case(name))
        }
        ReferenceOr::Item(schema) => transform_schema_to_type_ref(_parent_name, schema, ctx),
    }
}

/// Transform a ReferenceOr<Box<Schema>> into a TypeRef, extracting inline enums
fn transform_boxed_reference_or_schema_with_enum_extraction(
    parent_name: &str,
    property_name: &str,
    schema_ref: &ReferenceOr<Box<Schema>>,
    ctx: &mut TransformContext,
) -> TypeRef {
    match schema_ref {
        ReferenceOr::Reference { reference } => {
            let name = RefResolver::extract_schema_name(reference).unwrap_or("Unknown");
            TypeRef::named(name, to_pascal_case(name))
        }
        ReferenceOr::Item(schema) => {
            // Check if this is an inline string enum
            if let SchemaKind::Type(Type::String(string_type)) = &schema.schema_kind {
                if let Some(enum_node) = try_extract_inline_enum(parent_name, property_name, string_type) {
                    let enum_id = enum_node.id.clone();
                    let enum_name = enum_node.name.clone();
                    ctx.extracted_enums.insert(enum_id.clone(), enum_node);
                    return TypeRef::enum_ref(enum_id, enum_name);
                }
            }
            transform_schema_to_type_ref(parent_name, schema, ctx)
        }
    }
}

/// Transform an inline schema to a TypeRef
fn transform_schema_to_type_ref(_parent_name: &str, schema: &Schema, ctx: &mut TransformContext) -> TypeRef {
    match &schema.schema_kind {
        SchemaKind::Type(Type::String(_)) => TypeRef::string(),
        SchemaKind::Type(Type::Number(_)) => TypeRef::number(),
        SchemaKind::Type(Type::Integer(_)) => TypeRef::integer(),
        SchemaKind::Type(Type::Boolean(_)) => TypeRef::boolean(),
        SchemaKind::Type(Type::Array(arr)) => {
            let items = arr
                .items
                .as_ref()
                .map(|i| transform_boxed_reference_or_schema(_parent_name, i, ctx))
                .unwrap_or(TypeRef::any());
            TypeRef::array(items)
        }
        _ => TypeRef::Unknown,
    }
}

/// Convert to camelCase
fn to_camel_case(s: &str) -> String {
    let pascal = to_pascal_case(s);
    let mut chars = pascal.chars();
    match chars.next() {
        Some(c) => c.to_lowercase().collect::<String>() + chars.as_str(),
        None => String::new(),
    }
}

/// Convert to SCREAMING_SNAKE_CASE
fn to_screaming_snake_case(s: &str) -> String {
    let mut result = String::new();
    let chars: Vec<char> = s.chars().collect();

    for (i, &c) in chars.iter().enumerate() {
        // Add underscore before uppercase only if:
        // - Not at the start
        // - Previous char was lowercase (word boundary)
        if i > 0 && c.is_uppercase() {
            let prev = chars[i - 1];
            if prev.is_lowercase() {
                result.push('_');
            }
        }
        result.push(c.to_ascii_uppercase());
    }
    // Replace common separators
    result.replace('-', "_").replace(' ', "_")
}
