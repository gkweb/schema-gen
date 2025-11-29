//! # Schema-Gen Core
//!
//! High-performance OpenAPI to code generation engine.
//!
//! This crate provides the core functionality for parsing OpenAPI v3 specifications
//! and transforming them into a normalized AST that can be used for code generation.
//!
//! ## Features
//!
//! - **OpenAPI Parsing**: Full support for OpenAPI v3.0 and v3.1
//! - **AST Generation**: Normalized, strongly-typed intermediate representation
//! - **Code Generation**: Built-in generators for TypeScript types, enums, and constants
//! - **Extensibility**: Plugin-friendly architecture for custom generators
//!
//! ## Example
//!
//! ```rust,ignore
//! use schema_gen_core::{parse_spec, transform, generate};
//!
//! let spec = std::fs::read_to_string("openapi.yaml")?;
//! let openapi = parse_spec(&spec, SpecFormat::Yaml)?;
//! let ast = transform(openapi)?;
//! let files = generate(&ast, &config)?;
//! ```

pub mod ast;
pub mod codegen;
pub mod error;
pub mod parser;
pub mod transform;

pub use ast::SchemaAst;
pub use error::{Error, Result};
pub use parser::{parse_spec, SpecFormat};
pub use transform::transform;

/// Library version
pub const VERSION: &str = env!("CARGO_PKG_VERSION");
