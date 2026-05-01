//! Operation (endpoint) transformation

use crate::ast::{
    EndpointNode, HttpMethod, MediaTypeContent, ParameterLocation, ParameterNode, RequestBodyNode,
    ResponseNode, SchemaAst, SecurityRequirement, StatusCode, TypeRef,
};
use crate::error::Result;
use crate::parser::RefResolver;
use openapiv3::{OpenAPI, Operation, Parameter, ParameterSchemaOrContent, PathItem, ReferenceOr};

use super::normalize::to_pascal_case;

/// Transform all operations from the OpenAPI spec into AST endpoints
pub fn transform_operations(
    spec: &OpenAPI,
    _resolver: &mut RefResolver,
    ast: &mut SchemaAst,
) -> Result<()> {
    for (path, path_item_ref) in &spec.paths.paths {
        let ReferenceOr::Item(path_item) = path_item_ref else {
            continue;
        };

        transform_path_item(path, path_item, ast)?;
    }

    Ok(())
}

/// Transform a path item into endpoints
fn transform_path_item(path: &str, item: &PathItem, ast: &mut SchemaAst) -> Result<()> {
    // Get common parameters for this path
    let common_params: Vec<ParameterNode> = item
        .parameters
        .iter()
        .filter_map(|p| transform_parameter(p))
        .collect();

    // Transform each operation
    if let Some(op) = &item.get {
        ast.endpoints
            .push(transform_operation(HttpMethod::Get, path, op, &common_params)?);
    }
    if let Some(op) = &item.post {
        ast.endpoints
            .push(transform_operation(HttpMethod::Post, path, op, &common_params)?);
    }
    if let Some(op) = &item.put {
        ast.endpoints
            .push(transform_operation(HttpMethod::Put, path, op, &common_params)?);
    }
    if let Some(op) = &item.patch {
        ast.endpoints
            .push(transform_operation(HttpMethod::Patch, path, op, &common_params)?);
    }
    if let Some(op) = &item.delete {
        ast.endpoints.push(transform_operation(
            HttpMethod::Delete,
            path,
            op,
            &common_params,
        )?);
    }
    if let Some(op) = &item.head {
        ast.endpoints
            .push(transform_operation(HttpMethod::Head, path, op, &common_params)?);
    }
    if let Some(op) = &item.options {
        ast.endpoints.push(transform_operation(
            HttpMethod::Options,
            path,
            op,
            &common_params,
        )?);
    }

    Ok(())
}

/// Transform an operation into an endpoint
fn transform_operation(
    method: HttpMethod,
    path: &str,
    op: &Operation,
    common_params: &[ParameterNode],
) -> Result<EndpointNode> {
    // Generate ID from operation_id or method + path
    let id = op.operation_id.clone().unwrap_or_else(|| {
        format!(
            "{}{}",
            method.as_str(),
            to_pascal_case(&path.replace('/', "_").replace(['{', '}'], ""))
        )
    });

    // Combine common and operation-specific parameters
    let mut parameters: Vec<ParameterNode> = common_params.to_vec();
    parameters.extend(op.parameters.iter().filter_map(|p| transform_parameter(p)));

    // Transform request body
    let request_body = op.request_body.as_ref().and_then(|rb| match rb {
        ReferenceOr::Item(body) => Some(RequestBodyNode {
            description: body.description.clone(),
            required: body.required,
            content: body
                .content
                .iter()
                .map(|(media_type, content)| MediaTypeContent {
                    media_type: media_type.clone(),
                    type_ref: content.schema.as_ref().map(|s| transform_schema_ref(s)),
                })
                .collect(),
            extensions: body.extensions.clone(),
        }),
        ReferenceOr::Reference { .. } => None, // TODO: resolve reference
    });

    // Transform responses
    let responses: Vec<ResponseNode> = op
        .responses
        .responses
        .iter()
        .map(|(status, response_ref)| {
            let status_code = StatusCode::parse(&status.to_string());

            match response_ref {
                ReferenceOr::Item(response) => ResponseNode {
                    status_code,
                    description: response.description.clone().into(),
                    content: response
                        .content
                        .iter()
                        .map(|(media_type, content)| MediaTypeContent {
                            media_type: media_type.clone(),
                            type_ref: content.schema.as_ref().map(|s| transform_schema_ref(s)),
                        })
                        .collect(),
                    headers: vec![], // TODO: transform headers
                    extensions: response.extensions.clone(),
                },
                ReferenceOr::Reference { .. } => ResponseNode {
                    status_code,
                    description: None,
                    content: vec![],
                    headers: vec![],
                    extensions: Default::default(),
                },
            }
        })
        .collect();

    // Transform security requirements
    let security: Vec<SecurityRequirement> = op
        .security
        .as_ref()
        .map(|sec| {
            sec.iter()
                .flat_map(|s| {
                    s.iter().map(|(name, scopes)| SecurityRequirement {
                        name: name.clone(),
                        scopes: scopes.clone(),
                    })
                })
                .collect()
        })
        .unwrap_or_default();

    Ok(EndpointNode {
        id,
        operation_id: op.operation_id.clone(),
        method,
        path: path.to_string(),
        summary: op.summary.clone(),
        description: op.description.clone(),
        tags: op.tags.clone(),
        parameters,
        request_body,
        responses,
        security,
        deprecated: op.deprecated,
        query_type: method.into(),
        extensions: op.extensions.clone(),
    })
}

/// Transform a parameter
fn transform_parameter(param_ref: &ReferenceOr<Parameter>) -> Option<ParameterNode> {
    let ReferenceOr::Item(param) = param_ref else {
        return None; // TODO: resolve references
    };

    let param_data = match param {
        Parameter::Query { parameter_data, .. } => Some((parameter_data, ParameterLocation::Query)),
        Parameter::Header { parameter_data, .. } => {
            Some((parameter_data, ParameterLocation::Header))
        }
        Parameter::Path { parameter_data, .. } => Some((parameter_data, ParameterLocation::Path)),
        Parameter::Cookie { parameter_data, .. } => {
            Some((parameter_data, ParameterLocation::Cookie))
        }
    };

    let (data, location) = param_data?;

    let type_ref = match &data.format {
        ParameterSchemaOrContent::Schema(schema_ref) => transform_schema_ref(schema_ref),
        ParameterSchemaOrContent::Content(_) => TypeRef::any(),
    };

    Some(ParameterNode {
        name: data.name.clone(),
        location,
        description: data.description.clone(),
        type_ref,
        required: data.required,
        deprecated: data.deprecated.unwrap_or(false),
        style: None, // TODO: transform style
        explode: data.explode.unwrap_or(false),
        extensions: data.extensions.clone(),
    })
}

/// Transform a schema reference into a TypeRef
fn transform_schema_ref(schema_ref: &ReferenceOr<openapiv3::Schema>) -> TypeRef {
    match schema_ref {
        ReferenceOr::Reference { reference } => {
            let name = RefResolver::extract_schema_name(reference).unwrap_or("Unknown");
            TypeRef::named(name, to_pascal_case(name))
        }
        ReferenceOr::Item(schema) => transform_inline_schema(schema),
    }
}

/// Transform a boxed schema reference into a TypeRef
fn transform_boxed_schema_ref(schema_ref: &ReferenceOr<Box<openapiv3::Schema>>) -> TypeRef {
    match schema_ref {
        ReferenceOr::Reference { reference } => {
            let name = RefResolver::extract_schema_name(reference).unwrap_or("Unknown");
            TypeRef::named(name, to_pascal_case(name))
        }
        ReferenceOr::Item(schema) => transform_inline_schema(schema),
    }
}

/// Transform an inline schema to a TypeRef
fn transform_inline_schema(schema: &openapiv3::Schema) -> TypeRef {
    use openapiv3::{SchemaKind, Type};
    match &schema.schema_kind {
        SchemaKind::Type(Type::String(_)) => TypeRef::string(),
        SchemaKind::Type(Type::Integer(_)) => TypeRef::integer(),
        SchemaKind::Type(Type::Number(_)) => TypeRef::number(),
        SchemaKind::Type(Type::Boolean(_)) => TypeRef::boolean(),
        SchemaKind::Type(Type::Array(arr)) => {
            let items = arr
                .items
                .as_ref()
                .map(|i| transform_boxed_schema_ref(i))
                .unwrap_or(TypeRef::any());
            TypeRef::array(items)
        }
        _ => TypeRef::Unknown,
    }
}
