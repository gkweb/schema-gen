//! Naming convention utilities

use serde::{Deserialize, Serialize};

/// Naming convention options
#[derive(Debug, Clone, Copy, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum NamingConvention {
    /// PascalCase (e.g., MyTypeName)
    #[default]
    PascalCase,
    /// camelCase (e.g., myTypeName)
    CamelCase,
    /// snake_case (e.g., my_type_name)
    SnakeCase,
    /// SCREAMING_SNAKE_CASE (e.g., MY_TYPE_NAME)
    ScreamingSnakeCase,
    /// kebab-case (e.g., my-type-name)
    KebabCase,
    /// Preserve original naming
    Preserve,
}

/// Convert a string to PascalCase
pub fn to_pascal_case(s: &str) -> String {
    let mut result = String::new();
    let mut capitalize_next = true;

    for c in s.chars() {
        if c == '_' || c == '-' || c == ' ' || c == '.' {
            capitalize_next = true;
        } else if capitalize_next {
            result.push(c.to_ascii_uppercase());
            capitalize_next = false;
        } else {
            result.push(c);
        }
    }

    result
}

/// Convert a string to camelCase
pub fn to_camel_case(s: &str) -> String {
    let pascal = to_pascal_case(s);
    let mut chars = pascal.chars();
    match chars.next() {
        Some(c) => c.to_lowercase().collect::<String>() + chars.as_str(),
        None => String::new(),
    }
}

/// Convert a string to snake_case
pub fn to_snake_case(s: &str) -> String {
    let mut result = String::new();
    for (i, c) in s.chars().enumerate() {
        if c.is_uppercase() {
            if i > 0 {
                result.push('_');
            }
            result.push(c.to_ascii_lowercase());
        } else if c == '-' || c == ' ' || c == '.' {
            result.push('_');
        } else {
            result.push(c);
        }
    }
    result
}

/// Convert a string to SCREAMING_SNAKE_CASE
pub fn to_screaming_snake_case(s: &str) -> String {
    to_snake_case(s).to_ascii_uppercase()
}

/// Convert a string to kebab-case
pub fn to_kebab_case(s: &str) -> String {
    to_snake_case(s).replace('_', "-")
}

/// Apply a naming convention to a string
pub fn apply_naming_convention(s: &str, convention: NamingConvention) -> String {
    match convention {
        NamingConvention::PascalCase => to_pascal_case(s),
        NamingConvention::CamelCase => to_camel_case(s),
        NamingConvention::SnakeCase => to_snake_case(s),
        NamingConvention::ScreamingSnakeCase => to_screaming_snake_case(s),
        NamingConvention::KebabCase => to_kebab_case(s),
        NamingConvention::Preserve => s.to_string(),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_to_pascal_case() {
        assert_eq!(to_pascal_case("hello_world"), "HelloWorld");
        assert_eq!(to_pascal_case("hello-world"), "HelloWorld");
        assert_eq!(to_pascal_case("hello world"), "HelloWorld");
        assert_eq!(to_pascal_case("helloWorld"), "HelloWorld");
        assert_eq!(to_pascal_case("HelloWorld"), "HelloWorld");
    }

    #[test]
    fn test_to_camel_case() {
        assert_eq!(to_camel_case("hello_world"), "helloWorld");
        assert_eq!(to_camel_case("HelloWorld"), "helloWorld");
        assert_eq!(to_camel_case("HELLO_WORLD"), "hELLOWORLD"); // Preserves internal caps
    }

    #[test]
    fn test_to_snake_case() {
        assert_eq!(to_snake_case("HelloWorld"), "hello_world");
        assert_eq!(to_snake_case("helloWorld"), "hello_world");
        assert_eq!(to_snake_case("hello-world"), "hello_world");
    }

    #[test]
    fn test_to_screaming_snake_case() {
        assert_eq!(to_screaming_snake_case("HelloWorld"), "HELLO_WORLD");
        assert_eq!(to_screaming_snake_case("hello_world"), "HELLO_WORLD");
    }

    #[test]
    fn test_to_kebab_case() {
        assert_eq!(to_kebab_case("HelloWorld"), "hello-world");
        assert_eq!(to_kebab_case("hello_world"), "hello-world");
    }
}
