import { validate as openApiValidate } from '@readme/openapi-parser';
import type { ValidationResult, ValidationError } from '../types/validation';
import yaml from 'yaml';

/**
 * Validates an OpenAPI document against the OpenAPI 3.0/3.1 specification
 */
export async function validateOpenApiSpec(yamlContent: string): Promise<ValidationResult> {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];

  // First, try to parse the YAML
  let parsedSpec: unknown;
  try {
    parsedSpec = yaml.parse(yamlContent);
  } catch (e) {
    const yamlError = e as Error;
    errors.push({
      path: 'document',
      message: `YAML Parse Error: ${yamlError.message}`,
      severity: 'error',
    });
    return { isValid: false, errors, warnings };
  }

  if (!parsedSpec || typeof parsedSpec !== 'object') {
    errors.push({
      path: 'document',
      message: 'Invalid OpenAPI document: must be an object',
      severity: 'error',
    });
    return { isValid: false, errors, warnings };
  }

  // Perform structural validation checks
  const structuralErrors = performStructuralValidation(parsedSpec as Record<string, unknown>, yamlContent);
  errors.push(...structuralErrors.filter(e => e.severity === 'error'));
  warnings.push(...structuralErrors.filter(e => e.severity === 'warning'));

  // Use OpenAPI Parser for full spec validation
  try {
    await openApiValidate(parsedSpec as never);
  } catch (e) {
    const validationError = e as Error & { details?: Array<{ path: string[]; message: string }> };
    
    if (validationError.details && Array.isArray(validationError.details)) {
      for (const detail of validationError.details) {
        errors.push({
          path: detail.path?.join('.') || 'unknown',
          message: detail.message,
          severity: 'error',
          line: findLineNumber(yamlContent, detail.path),
        });
      }
    } else {
      errors.push({
        path: 'document',
        message: validationError.message || 'Unknown validation error',
        severity: 'error',
      });
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Performs structural validation checks for common OpenAPI issues
 */
function performStructuralValidation(
  spec: Record<string, unknown>,
  yamlContent: string
): ValidationError[] {
  const errors: ValidationError[] = [];

  // Check for required fields
  if (!spec.openapi) {
    errors.push({
      path: 'openapi',
      message: 'Missing required field "openapi". Must specify OpenAPI version (e.g., "3.0.3" or "3.1.0")',
      severity: 'error',
      line: 1,
    });
  } else {
    const version = String(spec.openapi);
    if (!version.startsWith('3.0') && !version.startsWith('3.1')) {
      errors.push({
        path: 'openapi',
        message: `Invalid OpenAPI version "${version}". Must be 3.0.x or 3.1.x`,
        severity: 'error',
        line: findLineNumber(yamlContent, ['openapi']),
      });
    }
  }

  if (!spec.info) {
    errors.push({
      path: 'info',
      message: 'Missing required field "info"',
      severity: 'error',
    });
  } else {
    const info = spec.info as Record<string, unknown>;
    if (!info.title) {
      errors.push({
        path: 'info.title',
        message: 'Missing required field "info.title"',
        severity: 'error',
        line: findLineNumber(yamlContent, ['info', 'title']),
      });
    }
    if (!info.version) {
      errors.push({
        path: 'info.version',
        message: 'Missing required field "info.version"',
        severity: 'error',
        line: findLineNumber(yamlContent, ['info', 'version']),
      });
    }
  }

  // Check paths
  if (!spec.paths) {
    errors.push({
      path: 'paths',
      message: 'Missing "paths" object. At least an empty paths object is recommended',
      severity: 'warning',
    });
  } else {
    const paths = spec.paths as Record<string, unknown>;
    validatePaths(paths, yamlContent, errors);
  }

  // Check components/schemas for common issues
  if (spec.components) {
    const components = spec.components as Record<string, unknown>;
    if (components.schemas) {
      validateSchemas(components.schemas as Record<string, unknown>, yamlContent, errors);
    }
  }

  return errors;
}

/**
 * Validates paths for common issues
 */
function validatePaths(
  paths: Record<string, unknown>,
  yamlContent: string,
  errors: ValidationError[] 
): void {
  for (const [pathKey, pathItem] of Object.entries(paths)) {
    // Check path format
    if (!pathKey.startsWith('/')) {
      errors.push({
        path: `paths.${pathKey}`,
        message: `Path "${pathKey}" must start with a forward slash (/)`,
        severity: 'error',
        line: findLineNumber(yamlContent, ['paths', pathKey]),
      });
    }

    // Check for path parameters in the URL
    const pathParams = pathKey.match(/\{([^}]+)\}/g);
    if (pathParams && pathItem && typeof pathItem === 'object') {
      const operations = ['get', 'post', 'put', 'patch', 'delete', 'options', 'head', 'trace'];
      for (const op of operations) {
        const operation = (pathItem as Record<string, unknown>)[op] as Record<string, unknown>;
        if (operation) {
          // Check if operation has operationId
          if (!operation.operationId) {
            errors.push({
              path: `paths.${pathKey}.${op}.operationId`,
              message: `Operation "${op.toUpperCase()} ${pathKey}" is missing operationId`,
              severity: 'warning',
              line: findLineNumber(yamlContent, ['paths', pathKey, op]),
            });
          }

          // Check if operation has at least one response
          if (!operation.responses || Object.keys(operation.responses as object).length === 0) {
            errors.push({
              path: `paths.${pathKey}.${op}.responses`,
              message: `Operation "${op.toUpperCase()} ${pathKey}" must have at least one response defined`,
              severity: 'error',
              line: findLineNumber(yamlContent, ['paths', pathKey, op]),
            });
          }

          // Check path parameters are defined
          const parameters = (operation.parameters || []) as Array<Record<string, unknown>>;
          for (const param of pathParams) {
            const paramName = param.slice(1, -1); // Remove { and }
            const isDefined = parameters.some(
              p => p.name === paramName && p.in === 'path'
            );
            if (!isDefined) {
              errors.push({
                path: `paths.${pathKey}.${op}.parameters`,
                message: `Path parameter "${paramName}" is used in path but not defined in parameters`,
                severity: 'error',
                line: findLineNumber(yamlContent, ['paths', pathKey, op, 'parameters']),
              });
            }
          }
        }
      }
    }
  }
}

/**
 * Validates schemas for common issues
 */
function validateSchemas(
  schemas: Record<string, unknown>,
  yamlContent: string,
  errors: ValidationError[]
): void {
  for (const [schemaName, schema] of Object.entries(schemas)) {
    if (schema && typeof schema === 'object') {
      const schemaObj = schema as Record<string, unknown>;
      
      // Check for type field
      if (!schemaObj.type && !schemaObj.$ref && !schemaObj.allOf && !schemaObj.oneOf && !schemaObj.anyOf) {
        errors.push({
          path: `components.schemas.${schemaName}`,
          message: `Schema "${schemaName}" should have a "type" field or use $ref/allOf/oneOf/anyOf`,
          severity: 'warning',
          line: findLineNumber(yamlContent, ['components', 'schemas', schemaName]),
        });
      }

      // Check object schemas have properties
      if (schemaObj.type === 'object' && !schemaObj.properties && !schemaObj.additionalProperties) {
        errors.push({
          path: `components.schemas.${schemaName}`,
          message: `Object schema "${schemaName}" should have "properties" or "additionalProperties" defined`,
          severity: 'warning',
          line: findLineNumber(yamlContent, ['components', 'schemas', schemaName]),
        });
      }

      // Check array schemas have items
      if (schemaObj.type === 'array' && !schemaObj.items) {
        errors.push({
          path: `components.schemas.${schemaName}.items`,
          message: `Array schema "${schemaName}" must have "items" defined`,
          severity: 'error',
          line: findLineNumber(yamlContent, ['components', 'schemas', schemaName]),
        });
      }
    }
  }
}

/**
 * Attempts to find the line number for a given path in the YAML content
 */
function findLineNumber(yamlContent: string, path: string[] | undefined): number | undefined {
  if (!path || path.length === 0) return undefined;

  const lines = yamlContent.split('\n');
  let currentIndent = 0;
  let pathIndex = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmedLine = line.trimStart();
    const lineIndent = line.length - trimmedLine.length;

    // Skip empty lines and comments
    if (!trimmedLine || trimmedLine.startsWith('#')) continue;

    // Check if this line matches the current path segment
    const searchKey = path[pathIndex];
    const keyPattern = new RegExp(`^['"]?${escapeRegExp(searchKey)}['"]?\\s*:`);

    if (keyPattern.test(trimmedLine) && lineIndent >= currentIndent) {
      pathIndex++;
      currentIndent = lineIndent;

      if (pathIndex >= path.length) {
        return i + 1; // Return 1-based line number
      }
    }
  }

  return undefined;
}

function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
