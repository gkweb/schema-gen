//! OpenAPI to AST transformation
//!
//! This module transforms a parsed OpenAPI specification into our normalized AST.

mod normalize;
mod operations;
mod schemas;

use crate::ast::{ApiInfo, SchemaAst, ServerInfo, TagNode};
use crate::error::Result;
use crate::parser::RefResolver;
use openapiv3::OpenAPI;

pub use normalize::NamingConvention;

/// Transform an OpenAPI specification into our AST
///
/// # Arguments
///
/// * `spec` - The parsed OpenAPI specification
///
/// # Returns
///
/// The transformed AST
pub fn transform(spec: OpenAPI) -> Result<SchemaAst> {
    let mut transformer = Transformer::new(&spec);
    transformer.transform()
}

/// Internal transformer state
struct Transformer<'a> {
    spec: &'a OpenAPI,
    resolver: RefResolver<'a>,
    ast: SchemaAst,
}

impl<'a> Transformer<'a> {
    /// Create a new transformer
    fn new(spec: &'a OpenAPI) -> Self {
        let info = Self::extract_info(spec);
        Self {
            spec,
            resolver: RefResolver::new(spec),
            ast: SchemaAst::new(info),
        }
    }

    /// Run the transformation
    fn transform(mut self) -> Result<SchemaAst> {
        // Extract tags
        self.extract_tags();

        // Transform schemas to types and enums
        self.transform_schemas()?;

        // Transform paths to endpoints
        self.transform_operations()?;

        Ok(self.ast)
    }

    /// Extract API info from the spec
    fn extract_info(spec: &OpenAPI) -> ApiInfo {
        let base_url = spec.servers.first().map(|s| s.url.clone());

        let servers = spec
            .servers
            .iter()
            .map(|s| ServerInfo {
                url: s.url.clone(),
                description: s.description.clone(),
            })
            .collect();

        ApiInfo {
            title: spec.info.title.clone(),
            version: spec.info.version.clone(),
            description: spec.info.description.clone(),
            base_url,
            servers,
        }
    }

    /// Extract tags from the spec
    fn extract_tags(&mut self) {
        self.ast.tags = self
            .spec
            .tags
            .iter()
            .map(|t| TagNode {
                name: t.name.clone(),
                description: t.description.clone(),
            })
            .collect();
    }

    /// Transform all schemas
    fn transform_schemas(&mut self) -> Result<()> {
        schemas::transform_schemas(self.spec, &mut self.resolver, &mut self.ast)
    }

    /// Transform all operations
    fn transform_operations(&mut self) -> Result<()> {
        operations::transform_operations(self.spec, &mut self.resolver, &mut self.ast)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::parser::{parse_spec, SpecFormat};

    const TEST_SPEC: &str = r#"
openapi: "3.0.3"
info:
  title: Test API
  version: "1.0.0"
  description: A test API
servers:
  - url: https://api.example.com
    description: Production server
tags:
  - name: users
    description: User operations
paths:
  /users:
    get:
      tags:
        - users
      summary: List users
      operationId: listUsers
      responses:
        "200":
          description: Success
components:
  schemas:
    User:
      type: object
      properties:
        id:
          type: integer
        name:
          type: string
      required:
        - id
        - name
"#;

    #[test]
    fn test_transform() {
        let spec = parse_spec(TEST_SPEC, SpecFormat::Yaml).unwrap();
        let ast = transform(spec).unwrap();

        assert_eq!(ast.info.title, "Test API");
        assert_eq!(ast.info.version, "1.0.0");
        assert!(ast.info.base_url.is_some());
        assert_eq!(ast.tags.len(), 1);
        assert_eq!(ast.tags[0].name, "users");
    }
}
