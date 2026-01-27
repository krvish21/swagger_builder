import type { SwaggerDocument } from '../types/swagger';

/**
 * Migrate old path format to new format if needed
 * Old format: SwaggerPath with method property
 * New format: SwaggerPath with operations array
 */
function ensureOperationsFormat(doc: SwaggerDocument): SwaggerDocument {
  return {
    ...doc,
    paths: doc.paths.map((path: any) => {
      // If operations array already exists, return as-is
      if (Array.isArray(path.operations)) {
        return path;
      }
      // Migrate old format to new format
      if (path.method) {
        const operation = {
          method: path.method,
          tags: path.tags || [],
          summary: path.summary || '',
          operationId: path.operationId || '',
          description: path.description || '',
          parameters: path.parameters || [],
          responses: path.responses || [],
          requestBody: path.requestBody,
          security: path.security,
          deprecated: path.deprecated,
        };
        return {
          path: path.path,
          operations: [operation],
        };
      }
      return path;
    }),
  };
}

/**
 * Formats a description for YAML output.
 * Uses literal block scalar (|) for multi-line content to preserve formatting.
 */
const formatDescription = (description: string, indent: number): string => {
  if (!description) {
    return `''`;
  }

  // Check if description contains newlines (multi-line content)
  if (description.includes('\n')) {
    const indentStr = ' '.repeat(indent);
    const lines = description.split('\n');
    // Use literal block scalar (|) to preserve newlines and formatting
    return `|\n${lines.map(line => `${indentStr}${line}`).join('\n')}`;
  }

  // Single line - escape single quotes and wrap in quotes
  return `'${description.replace(/'/g, "''")}'`;
};

export const buildYamlDocument = (doc: SwaggerDocument): string => {
  // Ensure paths are in new format (with operations array)
  const migratedDoc = ensureOperationsFormat(doc);

  let yaml = `openapi: ${migratedDoc.openapi}\n`;
  yaml += `info:\n`;
  yaml += `  title: ${migratedDoc.info.title}\n`;
  yaml += `  description: ${formatDescription(migratedDoc.info.description, 4)}\n`;
  yaml += `  version: "${migratedDoc.info.version}"\n`;

  // Terms of Service
  if (migratedDoc.info.termsOfService) {
    yaml += `  termsOfService: ${migratedDoc.info.termsOfService}\n`;
  }

  // Contact
  if (migratedDoc.info.contact && (migratedDoc.info.contact.name || migratedDoc.info.contact.email || migratedDoc.info.contact.url)) {
    yaml += `  contact:\n`;
    if (migratedDoc.info.contact.name) {
      yaml += `    name: ${migratedDoc.info.contact.name}\n`;
    }
    if (migratedDoc.info.contact.email) {
      yaml += `    email: ${migratedDoc.info.contact.email}\n`;
    }
    if (migratedDoc.info.contact.url) {
      yaml += `    url: ${migratedDoc.info.contact.url}\n`;
    }
  }

  // License
  if (migratedDoc.info.license && migratedDoc.info.license.name) {
    yaml += `  license:\n`;
    yaml += `    name: ${migratedDoc.info.license.name}\n`;
    if (migratedDoc.info.license.url) {
      yaml += `    url: ${migratedDoc.info.license.url}\n`;
    }
  }

  // Servers
  if (migratedDoc.servers.length > 0) {
    yaml += `servers:\n`;
    migratedDoc.servers.forEach((server) => {
      yaml += `  - url: ${server.url}\n`;
      if (server.description) {
        yaml += `    description: ${formatDescription(server.description, 6)}\n`;
      }
    });
  }

  if (migratedDoc.tags.length > 0) {
    yaml += `tags:\n`;
    migratedDoc.tags.forEach((tag) => {
      yaml += `  - name: ${tag.name}\n`;
      yaml += `    description: ${formatDescription(tag.description, 6)}\n`;
    });
  }

  if (migratedDoc.paths.length > 0) {
    yaml += `paths:\n`;
    migratedDoc.paths.forEach((path) => {
      yaml += `  '${path.path}':\n`;
      path.operations.forEach((operation) => {
        yaml += `    ${operation.method}:\n`;
        if (operation.tags.length > 0) {
          yaml += `      tags:\n`;
          operation.tags.forEach((tag) => {
            yaml += `        - ${tag}\n`;
          });
        }
        yaml += `      summary: ${operation.summary}\n`;
        yaml += `      operationId: ${operation.operationId}\n`;
        yaml += `      description: ${formatDescription(operation.description, 8)}\n`;

        // Deprecated flag
        if (operation.deprecated) {
          yaml += `      deprecated: true\n`;
        }

        if (operation.parameters.length > 0) {
          yaml += `      parameters:\n`;
          operation.parameters.forEach((param) => {
            yaml += `        - name: ${param.name}\n`;
            yaml += `          in: ${param.in}\n`;
            yaml += `          description: ${formatDescription(param.description, 12)}\n`;
            yaml += `          required: ${param.required}\n`;
            if (param.deprecated) {
              yaml += `          deprecated: true\n`;
            }
            yaml += `          schema:\n`;
            yaml += `            type: ${param.type}\n`;
            if (param.format) {
              yaml += `            format: ${param.format}\n`;
            }
            if (param.enum) {
              const enumArray = param.enum.split(',').map((v) => v.trim()).filter((v) => v !== '');
              if (enumArray.length > 0) {
                yaml += `            enum:\n`;
                enumArray.forEach((enumValue) => {
                  yaml += `              - ${enumValue}\n`;
                });
              }
            }
            if (param.default) {
              yaml += `            default: ${param.default}\n`;
            }
            if (param.example) {
              yaml += `          example: ${param.example}\n`;
            }
          });
        }

        // Request Body
        if (operation.requestBody) {
          yaml += `      requestBody:\n`;
          if (operation.requestBody.description) {
            yaml += `        description: ${formatDescription(operation.requestBody.description, 10)}\n`;
          }
          yaml += `        required: ${operation.requestBody.required}\n`;
          yaml += `        content:\n`;
          yaml += `          ${operation.requestBody.contentType || 'application/json'}:\n`;
          yaml += `            schema:\n`;
          if (operation.requestBody.schemaRef) {
            yaml += `              $ref: '#/components/schemas/${operation.requestBody.schemaRef}'\n`;
          } else {
            yaml += `              type: object\n`;
          }
        }

        if (operation.responses.length > 0) {
          yaml += `      responses:\n`;
          operation.responses.forEach((resp) => {
            yaml += `        '${resp.statusCode}':\n`;
            yaml += `          description: ${formatDescription(resp.description, 12)}\n`;
            yaml += `          content:\n`;
            yaml += `            application/vnd.api+json:\n`;
            yaml += `              schema:\n`;
            if (resp.schemaRef) {
              yaml += `                $ref: '#/components/schemas/${resp.schemaRef}'\n`;
            } else {
              yaml += `                type: object\n`;
            }
          });
        }
      });
    });
  }

  // Components section (schemas + securitySchemes)
  const hasSchemas = migratedDoc.schemas.length > 0;
  const hasSecuritySchemes = migratedDoc.securitySchemes.length > 0;

  if (hasSchemas || hasSecuritySchemes) {
    yaml += `components:\n`;

    // Security Schemes
    if (hasSecuritySchemes) {
      yaml += `  securitySchemes:\n`;
      migratedDoc.securitySchemes.forEach((scheme) => {
        yaml += `    ${scheme.name}:\n`;
        yaml += `      type: ${scheme.type}\n`;
        if (scheme.type === 'http') {
          yaml += `      scheme: ${scheme.scheme || 'bearer'}\n`;
          if (scheme.scheme === 'bearer' && scheme.bearerFormat) {
            yaml += `      bearerFormat: ${scheme.bearerFormat}\n`;
          }
        } else if (scheme.type === 'apiKey') {
          yaml += `      in: ${scheme.in || 'header'}\n`;
          yaml += `      name: ${scheme.apiKeyName || 'X-API-Key'}\n`;
        }
      });
    }

    // Schemas
    if (hasSchemas) {
      yaml += `  schemas:\n`;
      migratedDoc.schemas.forEach((schema) => {
        yaml += `    ${schema.name}:\n`;
        yaml += `      type: ${schema.type}\n`;
        if (schema.properties.length > 0) {
          yaml += `      properties:\n`;
          schema.properties.forEach((prop) => {
            yaml += `        ${prop.name}:\n`;

            // Handle object type with $ref
            if (prop.type === 'object' && prop.$ref) {
              yaml += `          $ref: '#/components/schemas/${prop.$ref}'\n`;
            }
            // Handle array type
            else if (prop.type === 'array') {
              yaml += `          type: array\n`;
              yaml += `          items:\n`;
              if (prop.items?.$ref) {
                yaml += `            $ref: '#/components/schemas/${prop.items.$ref}'\n`;
              } else {
                yaml += `            type: ${prop.items?.type || 'string'}\n`;
              }
              if (prop.description) {
                yaml += `          description: ${formatDescription(prop.description, 10)}\n`;
              }
            }
            // Handle primitive types
            else {
              yaml += `          type: ${prop.type}\n`;
              if (prop.format) {
                yaml += `          format: ${prop.format}\n`;
              }
              if (prop.nullable) {
                yaml += `          nullable: true\n`;
              }
              if (prop.deprecated) {
                yaml += `          deprecated: true\n`;
              }
              if (prop.readOnly) {
                yaml += `          readOnly: true\n`;
              }
              if (prop.writeOnly) {
                yaml += `          writeOnly: true\n`;
              }
              if (prop.default) {
                yaml += `          default: ${prop.default}\n`;
              }
              if (prop.pattern) {
                yaml += `          pattern: '${prop.pattern}'\n`;
              }
              // String constraints
              if (prop.type === 'string') {
                if (prop.minLength !== undefined && prop.minLength !== null) {
                  yaml += `          minLength: ${prop.minLength}\n`;
                }
                if (prop.maxLength !== undefined && prop.maxLength !== null) {
                  yaml += `          maxLength: ${prop.maxLength}\n`;
                }
              }
              // Number constraints
              if (prop.type === 'number' || prop.type === 'integer') {
                if (prop.minimum !== undefined && prop.minimum !== null) {
                  yaml += `          minimum: ${prop.minimum}\n`;
                }
                if (prop.maximum !== undefined && prop.maximum !== null) {
                  yaml += `          maximum: ${prop.maximum}\n`;
                }
              }
              // Parse enumValues string into array for YAML output
              const enumArray = prop.enumValues
                ? prop.enumValues.split(',').map((v) => v.trim()).filter((v) => v !== '')
                : [];
              if (enumArray.length > 0) {
                yaml += `          enum:\n`;
                enumArray.forEach((enumValue) => {
                  yaml += `            - ${enumValue}\n`;
                });
              }
              if (prop.description) {
                yaml += `          description: ${formatDescription(prop.description, 10)}\n`;
              }
              if (prop.example) {
                yaml += `          example: ${prop.example}\n`;
              }
            }
          });
        }
      });
    }
  }

  // Global security (if security schemes defined)
  if (hasSecuritySchemes) {
    yaml += `security:\n`;
    doc.securitySchemes.forEach((scheme) => {
      yaml += `  - ${scheme.name}: []\n`;
    });
  }

  return yaml;
};