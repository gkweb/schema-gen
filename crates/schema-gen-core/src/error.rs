//! Error types for schema-gen-core

use miette::Diagnostic;
use thiserror::Error;

/// Result type alias for schema-gen operations
pub type Result<T> = std::result::Result<T, Error>;

/// Main error type for schema-gen-core
#[derive(Error, Diagnostic, Debug)]
pub enum Error {
    /// Error parsing the OpenAPI specification
    #[error("Failed to parse OpenAPI specification")]
    #[diagnostic(code(schema_gen::parse_error))]
    ParseError {
        #[source]
        source: ParseErrorKind,
    },

    /// Error during AST transformation
    #[error("Failed to transform OpenAPI spec to AST")]
    #[diagnostic(code(schema_gen::transform_error))]
    TransformError {
        message: String,
        #[help]
        help: Option<String>,
    },

    /// Error resolving a $ref reference
    #[error("Failed to resolve reference: {reference}")]
    #[diagnostic(code(schema_gen::ref_error))]
    RefResolutionError {
        reference: String,
        #[help]
        help: Option<String>,
    },

    /// Error during code generation
    #[error("Code generation failed: {message}")]
    #[diagnostic(code(schema_gen::codegen_error))]
    CodegenError { message: String },

    /// IO error (file reading, etc.)
    #[error("IO error: {0}")]
    #[diagnostic(code(schema_gen::io_error))]
    IoError(#[from] std::io::Error),

    /// Validation error
    #[error("Validation error: {message}")]
    #[diagnostic(code(schema_gen::validation_error))]
    ValidationError {
        message: String,
        #[help]
        help: Option<String>,
    },
}

/// Specific parsing error types
#[derive(Error, Debug)]
pub enum ParseErrorKind {
    #[error("Invalid YAML: {0}")]
    InvalidYaml(#[from] serde_yaml::Error),

    #[error("Invalid JSON: {0}")]
    InvalidJson(#[from] serde_json::Error),

    #[error("Invalid OpenAPI specification: {0}")]
    InvalidSpec(String),

    #[error("Unsupported OpenAPI version: {0}")]
    UnsupportedVersion(String),
}

impl Error {
    /// Create a new parse error
    pub fn parse(source: ParseErrorKind) -> Self {
        Self::ParseError { source }
    }

    /// Create a new transform error
    pub fn transform(message: impl Into<String>) -> Self {
        Self::TransformError {
            message: message.into(),
            help: None,
        }
    }

    /// Create a new transform error with help text
    pub fn transform_with_help(message: impl Into<String>, help: impl Into<String>) -> Self {
        Self::TransformError {
            message: message.into(),
            help: Some(help.into()),
        }
    }

    /// Create a new reference resolution error
    pub fn ref_resolution(reference: impl Into<String>) -> Self {
        Self::RefResolutionError {
            reference: reference.into(),
            help: None,
        }
    }

    /// Create a new codegen error
    pub fn codegen(message: impl Into<String>) -> Self {
        Self::CodegenError {
            message: message.into(),
        }
    }

    /// Create a new validation error
    pub fn validation(message: impl Into<String>) -> Self {
        Self::ValidationError {
            message: message.into(),
            help: None,
        }
    }
}
