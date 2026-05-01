//! NAPI-RS bindings for schema-gen
//!
//! This crate provides Node.js bindings for the schema-gen core library,
//! enabling high-performance OpenAPI code generation from JavaScript/TypeScript.

use napi::bindgen_prelude::*;
use napi_derive::napi;
use schema_gen_core::{
    ast::SchemaAst,
    codegen::{generate_builtin, BuiltinGenerator, GeneratedFile as CoreGeneratedFile},
    parser::{parse_spec, SpecFormat},
    transform::transform,
};

/// Generated file result
#[napi(object)]
pub struct GeneratedFile {
    /// Relative path for the file
    pub path: String,
    /// File contents
    pub content: String,
    /// Whether to skip formatting
    pub skip_format: bool,
}

impl From<CoreGeneratedFile> for GeneratedFile {
    fn from(f: CoreGeneratedFile) -> Self {
        Self {
            path: f.path,
            content: f.content,
            skip_format: f.skip_format,
        }
    }
}

/// Parse an OpenAPI specification and return the AST as JSON
///
/// @param content - The specification content (JSON or YAML string)
/// @param format - The format: "json" or "yaml" (optional, auto-detected if not provided)
/// @returns The AST as a JSON string
#[napi]
pub fn parse_spec_to_ast(content: String, format: Option<String>) -> Result<String> {
    // Determine format
    let spec_format = match format.as_deref() {
        Some("json") => SpecFormat::Json,
        Some("yaml") | Some("yml") => SpecFormat::Yaml,
        _ => SpecFormat::detect(&content),
    };

    // Parse the spec
    let spec = parse_spec(&content, spec_format)
        .map_err(|e| Error::from_reason(format!("Failed to parse spec: {}", e)))?;

    // Transform to AST
    let ast = transform(spec)
        .map_err(|e| Error::from_reason(format!("Failed to transform spec: {}", e)))?;

    // Serialize to JSON
    serde_json::to_string_pretty(&ast)
        .map_err(|e| Error::from_reason(format!("Failed to serialize AST: {}", e)))
}

/// Parse an OpenAPI specification and return the AST as a JavaScript object
///
/// @param content - The specification content (JSON or YAML string)
/// @param format - The format: "json" or "yaml" (optional, auto-detected if not provided)
/// @returns The AST as a JavaScript object
#[napi(ts_return_type = "SchemaAst")]
pub fn parse_spec_to_object(content: String, format: Option<String>) -> Result<serde_json::Value> {
    // Determine format
    let spec_format = match format.as_deref() {
        Some("json") => SpecFormat::Json,
        Some("yaml") | Some("yml") => SpecFormat::Yaml,
        _ => SpecFormat::detect(&content),
    };

    // Parse the spec
    let spec = parse_spec(&content, spec_format)
        .map_err(|e| Error::from_reason(format!("Failed to parse spec: {}", e)))?;

    // Transform to AST
    let ast = transform(spec)
        .map_err(|e| Error::from_reason(format!("Failed to transform spec: {}", e)))?;

    // Convert to JSON value for JavaScript
    serde_json::to_value(&ast)
        .map_err(|e| Error::from_reason(format!("Failed to convert AST: {}", e)))
}

/// Parse an OpenAPI specification into the raw JS object representation
/// of the underlying YAML/JSON document, *without* running schema-gen's
/// AST transform.
///
/// Use this when you need to mutate the spec before parsing — for example,
/// in a pre-parse transformer hook (`input.transformer`, plugin `onSpec`).
///
/// @param content - The specification content (JSON or YAML string)
/// @param format - The format: "json" or "yaml" (optional, auto-detected if not provided)
/// @returns The raw spec as a JavaScript object
#[napi]
pub fn parse_raw_spec_to_object(
    content: String,
    format: Option<String>,
) -> Result<serde_json::Value> {
    let spec_format = match format.as_deref() {
        Some("json") => SpecFormat::Json,
        Some("yaml") | Some("yml") => SpecFormat::Yaml,
        _ => SpecFormat::detect(&content),
    };

    match spec_format {
        SpecFormat::Json => serde_json::from_str(&content)
            .map_err(|e| Error::from_reason(format!("Failed to parse JSON spec: {}", e))),
        SpecFormat::Yaml => serde_yaml::from_str(&content)
            .map_err(|e| Error::from_reason(format!("Failed to parse YAML spec: {}", e))),
    }
}

/// Run schema-gen's AST transform on a pre-parsed OpenAPI document
/// supplied as JSON. Pair with `parse_raw_spec_to_object` for a
/// "parse → mutate in JS → transform" pipeline.
///
/// @param specJson - The OpenAPI document as a JSON string
/// @returns The AST as a JavaScript object
#[napi(ts_return_type = "SchemaAst")]
pub fn transform_spec_object(spec_json: String) -> Result<serde_json::Value> {
    let spec: openapiv3::OpenAPI = serde_json::from_str(&spec_json)
        .map_err(|e| Error::from_reason(format!("Failed to deserialize spec object: {}", e)))?;

    if !spec.openapi.starts_with("3.0") && !spec.openapi.starts_with("3.1") {
        return Err(Error::from_reason(format!(
            "Unsupported OpenAPI version: {}",
            spec.openapi
        )));
    }

    let ast = transform(spec)
        .map_err(|e| Error::from_reason(format!("Failed to transform spec: {}", e)))?;

    serde_json::to_value(&ast)
        .map_err(|e| Error::from_reason(format!("Failed to convert AST: {}", e)))
}

/// Validate an OpenAPI specification
///
/// @param content - The specification content (JSON or YAML string)
/// @param format - The format: "json" or "yaml" (optional, auto-detected if not provided)
/// @returns True if valid, throws an error if invalid
#[napi]
pub fn validate_spec(content: String, format: Option<String>) -> Result<bool> {
    let spec_format = match format.as_deref() {
        Some("json") => SpecFormat::Json,
        Some("yaml") | Some("yml") => SpecFormat::Yaml,
        _ => SpecFormat::detect(&content),
    };

    parse_spec(&content, spec_format)
        .map_err(|e| Error::from_reason(format!("Invalid specification: {}", e)))?;

    Ok(true)
}

/// Generate TypeScript types from an AST
///
/// @param astJson - The AST as a JSON string
/// @param options - Generation options as a JSON string
/// @returns Array of generated files
#[napi]
pub fn generate_typescript_types(
    ast_json: String,
    options: Option<String>,
) -> Result<Vec<GeneratedFile>> {
    let ast: SchemaAst = serde_json::from_str(&ast_json)
        .map_err(|e| Error::from_reason(format!("Invalid AST JSON: {}", e)))?;

    let opts: serde_json::Value = options
        .map(|o| serde_json::from_str(&o))
        .transpose()
        .map_err(|e| Error::from_reason(format!("Invalid options JSON: {}", e)))?
        .unwrap_or(serde_json::Value::Object(Default::default()));

    let files = generate_builtin(BuiltinGenerator::TypescriptTypes, &ast, &opts)
        .map_err(|e| Error::from_reason(format!("Generation failed: {}", e)))?;

    Ok(files.into_iter().map(GeneratedFile::from).collect())
}

/// Generate TypeScript enums from an AST
///
/// @param astJson - The AST as a JSON string
/// @param options - Generation options as a JSON string
/// @returns Array of generated files
#[napi]
pub fn generate_typescript_enums(
    ast_json: String,
    options: Option<String>,
) -> Result<Vec<GeneratedFile>> {
    let ast: SchemaAst = serde_json::from_str(&ast_json)
        .map_err(|e| Error::from_reason(format!("Invalid AST JSON: {}", e)))?;

    let opts: serde_json::Value = options
        .map(|o| serde_json::from_str(&o))
        .transpose()
        .map_err(|e| Error::from_reason(format!("Invalid options JSON: {}", e)))?
        .unwrap_or(serde_json::Value::Object(Default::default()));

    let files = generate_builtin(BuiltinGenerator::TypescriptEnums, &ast, &opts)
        .map_err(|e| Error::from_reason(format!("Generation failed: {}", e)))?;

    Ok(files.into_iter().map(GeneratedFile::from).collect())
}

/// Generate constants from an AST
///
/// @param astJson - The AST as a JSON string
/// @param options - Generation options as a JSON string
/// @returns Array of generated files
#[napi]
pub fn generate_constants(
    ast_json: String,
    options: Option<String>,
) -> Result<Vec<GeneratedFile>> {
    let ast: SchemaAst = serde_json::from_str(&ast_json)
        .map_err(|e| Error::from_reason(format!("Invalid AST JSON: {}", e)))?;

    let opts: serde_json::Value = options
        .map(|o| serde_json::from_str(&o))
        .transpose()
        .map_err(|e| Error::from_reason(format!("Invalid options JSON: {}", e)))?
        .unwrap_or(serde_json::Value::Object(Default::default()));

    let files = generate_builtin(BuiltinGenerator::Constants, &ast, &opts)
        .map_err(|e| Error::from_reason(format!("Generation failed: {}", e)))?;

    Ok(files.into_iter().map(GeneratedFile::from).collect())
}

/// Get the schema-gen version
#[napi]
pub fn get_version() -> String {
    schema_gen_core::VERSION.to_string()
}

/// Full generation pipeline: parse spec → transform → generate
///
/// @param content - The specification content (JSON or YAML string)
/// @param format - The format: "json" or "yaml" (optional, auto-detected if not provided)
/// @param generators - Array of generator names to run: ["typescript-types", "typescript-enums", "constants"]
/// @param options - Generation options as a JSON string
/// @returns Array of generated files
#[napi]
pub fn generate(
    content: String,
    format: Option<String>,
    generators: Vec<String>,
    options: Option<String>,
) -> Result<Vec<GeneratedFile>> {
    // Parse
    let spec_format = match format.as_deref() {
        Some("json") => SpecFormat::Json,
        Some("yaml") | Some("yml") => SpecFormat::Yaml,
        _ => SpecFormat::detect(&content),
    };

    let spec = parse_spec(&content, spec_format)
        .map_err(|e| Error::from_reason(format!("Failed to parse spec: {}", e)))?;

    // Transform
    let ast = transform(spec)
        .map_err(|e| Error::from_reason(format!("Failed to transform spec: {}", e)))?;

    // Parse options
    let opts: serde_json::Value = options
        .map(|o| serde_json::from_str(&o))
        .transpose()
        .map_err(|e| Error::from_reason(format!("Invalid options JSON: {}", e)))?
        .unwrap_or(serde_json::Value::Object(Default::default()));

    // Generate
    let mut all_files = Vec::new();

    for gen_name in generators {
        let generator = match gen_name.as_str() {
            "typescript-types" => BuiltinGenerator::TypescriptTypes,
            "typescript-enums" => BuiltinGenerator::TypescriptEnums,
            "constants" => BuiltinGenerator::Constants,
            _ => {
                return Err(Error::from_reason(format!(
                    "Unknown generator: {}",
                    gen_name
                )))
            }
        };

        let files = generate_builtin(generator, &ast, &opts)
            .map_err(|e| Error::from_reason(format!("Generation failed: {}", e)))?;

        all_files.extend(files.into_iter().map(GeneratedFile::from));
    }

    Ok(all_files)
}
