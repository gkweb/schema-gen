//! Integration tests for vendor extension (`x-*`) preservation across the AST.

use schema_gen_core::parser::{parse_spec, SpecFormat};
use schema_gen_core::transform::transform;

const SPEC_WITH_EXTENSIONS: &str = r#"
openapi: "3.0.3"
x-spec-id: spec-42
info:
  title: Test API
  version: "1.0.0"
paths:
  /widgets:
    get:
      operationId: listWidgets
      x-rate-limit: high
      tags: [widgets]
      parameters:
        - name: limit
          in: query
          required: false
          schema:
            type: integer
          x-param-trace: enabled
      requestBody:
        x-body-tag: alpha
        required: false
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/Widget'
      responses:
        "200":
          description: OK
          x-response-tag: ok
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Widget'
components:
  schemas:
    Widget:
      type: object
      x-deprecated-since: "2025-01"
      properties:
        id:
          type: integer
          x-property-tag: prop-id
        kind:
          type: string
          enum:
            - small
            - large
          x-enum-tag: enum-kind
      required:
        - id
"#;

#[test]
fn vendor_extensions_round_trip_into_the_ast() {
    let spec = parse_spec(SPEC_WITH_EXTENSIONS, SpecFormat::Yaml).expect("spec parses");
    let ast = transform(spec).expect("ast transforms");

    // Spec-root extension
    assert_eq!(
        ast.extensions.get("x-spec-id").and_then(|v| v.as_str()),
        Some("spec-42"),
        "spec-root x-* should reach SchemaAst.extensions"
    );

    // Endpoint-level extension
    let endpoint = ast
        .endpoints
        .iter()
        .find(|e| e.operation_id.as_deref() == Some("listWidgets"))
        .expect("listWidgets endpoint");
    assert_eq!(
        endpoint.extensions.get("x-rate-limit").and_then(|v| v.as_str()),
        Some("high"),
        "operation x-* should reach EndpointNode.extensions"
    );

    // Parameter-level extension
    let limit_param = endpoint
        .parameters
        .iter()
        .find(|p| p.name == "limit")
        .expect("limit parameter");
    assert_eq!(
        limit_param.extensions.get("x-param-trace").and_then(|v| v.as_str()),
        Some("enabled"),
        "parameter x-* should reach ParameterNode.extensions"
    );

    // Request body extension
    let body = endpoint.request_body.as_ref().expect("request body");
    assert_eq!(
        body.extensions.get("x-body-tag").and_then(|v| v.as_str()),
        Some("alpha"),
        "request body x-* should reach RequestBodyNode.extensions"
    );

    // Response extension
    let response = endpoint.responses.first().expect("response");
    assert_eq!(
        response.extensions.get("x-response-tag").and_then(|v| v.as_str()),
        Some("ok"),
        "response x-* should reach ResponseNode.extensions"
    );

    // Schema-level extension on the Widget type
    let widget = ast.types.get("Widget").expect("Widget type");
    assert_eq!(
        widget.extensions.get("x-deprecated-since").and_then(|v| v.as_str()),
        Some("2025-01"),
        "schema x-* should reach TypeNode.extensions"
    );

    // Property-level extension
    let id_prop = match &widget.kind {
        schema_gen_core::ast::TypeKind::Object { properties, .. } => properties
            .iter()
            .find(|p| p.original_name == "id")
            .expect("id property"),
        _ => panic!("Widget should be an object"),
    };
    assert_eq!(
        id_prop.extensions.get("x-property-tag").and_then(|v| v.as_str()),
        Some("prop-id"),
        "inline property x-* should reach PropertyNode.extensions"
    );

    // Inline enum extracted from a property — the enum's extensions
    // should mirror the source schema's extensions.
    let kind_enum_id = "Widget_Kind";
    let kind_enum = ast
        .enums
        .get(kind_enum_id)
        .expect("Widget_Kind enum extracted");
    assert_eq!(
        kind_enum.extensions.get("x-enum-tag").and_then(|v| v.as_str()),
        Some("enum-kind"),
        "inline-enum x-* should reach EnumNode.extensions"
    );
}

#[test]
fn extensions_default_to_empty_when_absent() {
    let minimal = r#"
openapi: "3.0.3"
info:
  title: Minimal
  version: "1.0.0"
paths: {}
components:
  schemas:
    Plain:
      type: object
      properties:
        id: { type: integer }
"#;
    let spec = parse_spec(minimal, SpecFormat::Yaml).expect("spec parses");
    let ast = transform(spec).expect("ast transforms");

    assert!(ast.extensions.is_empty());
    let plain = ast.types.get("Plain").expect("Plain type");
    assert!(plain.extensions.is_empty());

    // Round-trip through JSON to confirm `skip_serializing_if` does not
    // produce stray fields and the deserializer still accepts the result.
    let json = serde_json::to_string(&ast).expect("serialize");
    assert!(
        !json.contains("\"extensions\""),
        "empty extensions must be omitted from JSON; saw {json}"
    );
    let restored: schema_gen_core::ast::SchemaAst =
        serde_json::from_str(&json).expect("deserialize");
    assert_eq!(restored.types.len(), 1);
}
