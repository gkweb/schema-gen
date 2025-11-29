//! $ref resolution for OpenAPI specifications

use crate::error::{Error, Result};
use indexmap::IndexMap;
use openapiv3::{OpenAPI, ReferenceOr, Schema};

/// Resolver for $ref references in OpenAPI specifications
#[derive(Debug)]
pub struct RefResolver<'a> {
    spec: &'a OpenAPI,
    /// Cache of resolved schemas
    schema_cache: IndexMap<String, &'a Schema>,
}

impl<'a> RefResolver<'a> {
    /// Create a new resolver for the given specification
    pub fn new(spec: &'a OpenAPI) -> Self {
        Self {
            spec,
            schema_cache: IndexMap::new(),
        }
    }

    /// Resolve a schema reference
    ///
    /// # Arguments
    ///
    /// * `reference` - The reference string (e.g., "#/components/schemas/User")
    ///
    /// # Returns
    ///
    /// The resolved schema, or an error if the reference cannot be resolved
    pub fn resolve_schema(&mut self, reference: &str) -> Result<&'a Schema> {
        // Check cache first
        if let Some(schema) = self.schema_cache.get(reference) {
            return Ok(*schema);
        }

        // Parse the reference
        let schema = self.resolve_schema_ref(reference)?;

        // Cache the result
        self.schema_cache.insert(reference.to_string(), schema);

        Ok(schema)
    }

    /// Resolve a ReferenceOr<Schema> to a Schema
    pub fn resolve_schema_or_ref(&mut self, schema_or_ref: &'a ReferenceOr<Schema>) -> Result<&'a Schema> {
        match schema_or_ref {
            ReferenceOr::Reference { reference } => self.resolve_schema(reference),
            ReferenceOr::Item(schema) => Ok(schema),
        }
    }

    /// Internal schema reference resolution
    fn resolve_schema_ref(&self, reference: &str) -> Result<&'a Schema> {
        // Only support local references for now
        if !reference.starts_with('#') {
            return Err(Error::ref_resolution(format!(
                "External references not yet supported: {}",
                reference
            )));
        }

        // Parse JSON pointer
        let parts: Vec<&str> = reference
            .trim_start_matches("#/")
            .split('/')
            .collect();

        if parts.len() != 3 || parts[0] != "components" || parts[1] != "schemas" {
            return Err(Error::ref_resolution(format!(
                "Invalid schema reference format: {}",
                reference
            )));
        }

        let schema_name = parts[2];

        // Look up in components/schemas
        let components = self.spec.components.as_ref().ok_or_else(|| {
            Error::ref_resolution(format!(
                "No components section found for reference: {}",
                reference
            ))
        })?;

        let schema_ref = components.schemas.get(schema_name).ok_or_else(|| {
            Error::ref_resolution(format!("Schema not found: {}", schema_name))
        })?;

        // Resolve if it's another reference
        match schema_ref {
            ReferenceOr::Reference { reference: inner_ref } => {
                // Recursive reference resolution
                self.resolve_schema_ref(inner_ref)
            }
            ReferenceOr::Item(schema) => Ok(schema),
        }
    }

    /// Extract the schema name from a reference string
    pub fn extract_schema_name(reference: &str) -> Option<&str> {
        reference
            .strip_prefix("#/components/schemas/")
            .or_else(|| reference.rsplit('/').next())
    }

    /// Check if a reference is circular
    pub fn is_circular(&self, _reference: &str, _visited: &[String]) -> bool {
        // TODO: Implement circular reference detection
        false
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_extract_schema_name() {
        assert_eq!(
            RefResolver::extract_schema_name("#/components/schemas/User"),
            Some("User")
        );
        assert_eq!(
            RefResolver::extract_schema_name("#/components/schemas/UserResponse"),
            Some("UserResponse")
        );
    }
}
