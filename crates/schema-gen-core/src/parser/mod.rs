//! OpenAPI specification parser
//!
//! This module handles parsing OpenAPI v3 specifications from JSON or YAML format.

mod refs;

pub use refs::RefResolver;

use crate::error::{Error, ParseErrorKind, Result};
use openapiv3::OpenAPI;

/// Supported specification formats
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum SpecFormat {
    /// JSON format
    Json,
    /// YAML format
    Yaml,
}

impl SpecFormat {
    /// Detect format from file extension
    pub fn from_extension(path: &str) -> Option<Self> {
        let path_lower = path.to_lowercase();
        if path_lower.ends_with(".json") {
            Some(SpecFormat::Json)
        } else if path_lower.ends_with(".yaml") || path_lower.ends_with(".yml") {
            Some(SpecFormat::Yaml)
        } else {
            None
        }
    }

    /// Detect format from content (tries JSON first, then YAML)
    pub fn detect(content: &str) -> Self {
        let trimmed = content.trim();
        if trimmed.starts_with('{') {
            SpecFormat::Json
        } else {
            SpecFormat::Yaml
        }
    }
}

/// Parse an OpenAPI specification from string content
///
/// # Arguments
///
/// * `content` - The specification content as a string
/// * `format` - The format of the content (JSON or YAML)
///
/// # Returns
///
/// The parsed OpenAPI specification
///
/// # Errors
///
/// Returns an error if the content cannot be parsed or is not a valid OpenAPI spec
pub fn parse_spec(content: &str, format: SpecFormat) -> Result<OpenAPI> {
    let spec: OpenAPI = match format {
        SpecFormat::Json => {
            serde_json::from_str(content).map_err(|e| Error::parse(ParseErrorKind::InvalidJson(e)))?
        }
        SpecFormat::Yaml => {
            serde_yaml::from_str(content).map_err(|e| Error::parse(ParseErrorKind::InvalidYaml(e)))?
        }
    };

    // Validate OpenAPI version
    validate_version(&spec)?;

    Ok(spec)
}

/// Parse an OpenAPI specification, auto-detecting the format
pub fn parse_spec_auto(content: &str) -> Result<OpenAPI> {
    let format = SpecFormat::detect(content);
    parse_spec(content, format)
}

/// Validate that the OpenAPI version is supported
fn validate_version(spec: &OpenAPI) -> Result<()> {
    let version = &spec.openapi;

    // We support OpenAPI 3.0.x and 3.1.x
    if version.starts_with("3.0") || version.starts_with("3.1") {
        Ok(())
    } else {
        Err(Error::parse(ParseErrorKind::UnsupportedVersion(
            version.clone(),
        )))
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    const MINIMAL_SPEC_YAML: &str = r#"
openapi: "3.0.3"
info:
  title: Test API
  version: "1.0.0"
paths: {}
"#;

    const MINIMAL_SPEC_JSON: &str = r#"{
  "openapi": "3.0.3",
  "info": {
    "title": "Test API",
    "version": "1.0.0"
  },
  "paths": {}
}"#;

    #[test]
    fn test_parse_yaml() {
        let spec = parse_spec(MINIMAL_SPEC_YAML, SpecFormat::Yaml).unwrap();
        assert_eq!(spec.info.title, "Test API");
    }

    #[test]
    fn test_parse_json() {
        let spec = parse_spec(MINIMAL_SPEC_JSON, SpecFormat::Json).unwrap();
        assert_eq!(spec.info.title, "Test API");
    }

    #[test]
    fn test_auto_detect_json() {
        let format = SpecFormat::detect(MINIMAL_SPEC_JSON);
        assert_eq!(format, SpecFormat::Json);
    }

    #[test]
    fn test_auto_detect_yaml() {
        let format = SpecFormat::detect(MINIMAL_SPEC_YAML);
        assert_eq!(format, SpecFormat::Yaml);
    }

    #[test]
    fn test_format_from_extension() {
        assert_eq!(
            SpecFormat::from_extension("api.json"),
            Some(SpecFormat::Json)
        );
        assert_eq!(
            SpecFormat::from_extension("api.yaml"),
            Some(SpecFormat::Yaml)
        );
        assert_eq!(
            SpecFormat::from_extension("api.yml"),
            Some(SpecFormat::Yaml)
        );
        assert_eq!(SpecFormat::from_extension("api.txt"), None);
    }
}
