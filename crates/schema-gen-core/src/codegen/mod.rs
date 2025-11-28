//! Code generation module
//!
//! This module contains built-in code generators for common output formats.
//! Custom generators can be implemented as plugins in TypeScript.

mod typescript;

pub use typescript::{TypeScriptGenerator, TypeScriptOptions};

use crate::ast::SchemaAst;
use crate::error::Result;
use serde::{Deserialize, Serialize};

/// A generated file
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GeneratedFile {
    /// Relative path for the file
    pub path: String,
    /// File contents
    pub content: String,
    /// Whether to skip formatting
    #[serde(default)]
    pub skip_format: bool,
}

/// Code generator trait
pub trait Generator {
    /// Generate code from the AST
    fn generate(&self, ast: &SchemaAst) -> Result<Vec<GeneratedFile>>;
}

/// Built-in generator types
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "kebab-case")]
pub enum BuiltinGenerator {
    /// TypeScript types
    TypescriptTypes,
    /// TypeScript enums
    TypescriptEnums,
    /// Constants (paths, methods)
    Constants,
}

/// Generate code using a built-in generator
pub fn generate_builtin(
    generator: BuiltinGenerator,
    ast: &SchemaAst,
    options: &serde_json::Value,
) -> Result<Vec<GeneratedFile>> {
    match generator {
        BuiltinGenerator::TypescriptTypes => {
            let opts: TypeScriptOptions = serde_json::from_value(options.clone()).unwrap_or_default();
            let gen = TypeScriptGenerator::new(opts);
            gen.generate(ast)
        }
        BuiltinGenerator::TypescriptEnums => {
            let opts: TypeScriptOptions = serde_json::from_value(options.clone()).unwrap_or_default();
            let gen = TypeScriptGenerator::new(opts);
            gen.generate_enums(ast)
        }
        BuiltinGenerator::Constants => {
            let opts: TypeScriptOptions = serde_json::from_value(options.clone()).unwrap_or_default();
            let gen = TypeScriptGenerator::new(opts);
            gen.generate_constants(ast)
        }
    }
}
