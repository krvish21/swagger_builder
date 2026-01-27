import yaml from 'yaml';
import type {
  SwaggerDocument,
  SwaggerInfo,
  SwaggerServer,
  SwaggerSecurityScheme,
  SwaggerTag,
  SwaggerPath,
  PathOperation,
  SwaggerSchema,
  SchemaProperty,
  PathParameter,
  PathResponse,
  RequestBody,
} from '../types/swagger';

interface OpenApiDocument {
  openapi?: string;
  info?: {
    title?: string;
    description?: string;
    version?: string;
  };
  servers?: Array<{
    url?: string;
    description?: string;
  }>;
  tags?: Array<{
    name?: string;
    description?: string;
  }>;
  paths?: Record<string, Record<string, unknown>>;
  components?: {
    schemas?: Record<string, unknown>;
    securitySchemes?: Record<string, unknown>;
  };
  security?: Array<Record<string, unknown[]>>;
}

interface ImportResult {
  success: boolean;
  document?: SwaggerDocument;
  errors: string[];
  warnings: string[];
}

/**
 * Extract schema name from $ref string
 * e.g., "#/components/schemas/PaymentPlan" -> "PaymentPlan"
 */
function extractSchemaRef(ref: string | undefined): string {
  if (!ref) return '';
  const match = ref.match(/#\/components\/schemas\/(.+)/);
  return match ? match[1] : '';
}

/**
 * Parse security schemes from OpenAPI format
 */
function parseSecuritySchemes(
  schemes: Record<string, unknown> | undefined
): SwaggerSecurityScheme[] {
  if (!schemes) return [];

  return Object.entries(schemes).map(([name, scheme]) => {
    const s = scheme as Record<string, unknown>;
    const result: SwaggerSecurityScheme = {
      name,
      type: (s.type as SwaggerSecurityScheme['type']) || 'http',
    };

    if (s.type === 'http') {
      result.scheme = (s.scheme as string) || 'bearer';
      if (s.bearerFormat) {
        result.bearerFormat = s.bearerFormat as string;
      }
    } else if (s.type === 'apiKey') {
      result.in = (s.in as 'header' | 'query' | 'cookie') || 'header';
      result.apiKeyName = (s.name as string) || '';
    }

    return result;
  });
}

/**
 * Parse a schema property from OpenAPI format
 */
function parseSchemaProperty(
  name: string,
  prop: Record<string, unknown>,
  requiredFields: string[] = []
): SchemaProperty {
  const result: SchemaProperty = {
    name,
    type: '' as SchemaProperty['type'],
    description: (prop.description as string) || '',
    example: prop.example !== undefined ? String(prop.example) : '',
    required: requiredFields.includes(name),
    $ref: '',
    items: { type: 'string', $ref: '' },
    enumValues: '',
  };

  // Handle $ref at property level (object reference)
  if (prop.$ref) {
    result.type = 'object';
    result.$ref = extractSchemaRef(prop.$ref as string);
    return result;
  }

  // Set the type
  const propType = prop.type as string;
  if (['string', 'number', 'integer', 'boolean', 'array', 'object'].includes(propType)) {
    result.type = propType as SchemaProperty['type'];
  }

  // Handle format
  if (prop.format) {
    result.format = prop.format as string;
  }

  // Handle enum values
  if (prop.enum && Array.isArray(prop.enum)) {
    result.enumValues = prop.enum.join(', ');
  }

  // Handle array items
  if (propType === 'array' && prop.items) {
    const items = prop.items as Record<string, unknown>;
    if (items.$ref) {
      result.items = { type: 'object', $ref: extractSchemaRef(items.$ref as string) };
    } else {
      result.items = { type: (items.type as string) || 'string', $ref: '' };
    }
  }

  return result;
}

/**
 * Parse schemas from OpenAPI format
 */
function parseSchemas(schemas: Record<string, unknown> | undefined): SwaggerSchema[] {
  if (!schemas) return [];

  return Object.entries(schemas).map(([name, schema]) => {
    const s = schema as Record<string, unknown>;
    const requiredFields = (s.required as string[]) || [];

    const result: SwaggerSchema = {
      name,
      type: (s.type as 'object' | 'array') || 'object',
      properties: [],
    };

    // Parse properties
    if (s.properties && typeof s.properties === 'object') {
      const props = s.properties as Record<string, unknown>;
      result.properties = Object.entries(props).map(([propName, propDef]) =>
        parseSchemaProperty(propName, propDef as Record<string, unknown>, requiredFields)
      );
    }

    return result;
  });
}

/**
 * Parse parameters from OpenAPI path operation
 */
function parseParameters(params: unknown[] | undefined): PathParameter[] {
  if (!params || !Array.isArray(params)) return [];

  return params.map((param) => {
    const p = param as Record<string, unknown>;
    const schema = p.schema as Record<string, unknown> | undefined;

    return {
      name: (p.name as string) || '',
      in: (p.in as 'path' | 'query' | 'header' | 'cookie') || 'path',
      description: (p.description as string) || '',
      required: (p.required as boolean) ?? false,
      type: schema?.type ? String(schema.type) : 'string',
    };
  });
}

/**
 * Parse responses from OpenAPI path operation
 */
function parseResponses(responses: Record<string, unknown> | undefined): PathResponse[] {
  if (!responses) return [];

  return Object.entries(responses).map(([statusCode, response]) => {
    const r = response as Record<string, unknown>;
    let schemaRef = '';

    // Try to extract schema ref from content
    if (r.content && typeof r.content === 'object') {
      const content = r.content as Record<string, unknown>;
      // Check common content types
      const contentTypes = ['application/json', 'application/vnd.api+json', '*/*'];
      for (const ct of contentTypes) {
        if (content[ct]) {
          const mediaType = content[ct] as Record<string, unknown>;
          if (mediaType.schema) {
            const schema = mediaType.schema as Record<string, unknown>;
            if (schema.$ref) {
              schemaRef = extractSchemaRef(schema.$ref as string);
              break;
            }
          }
        }
      }
    }

    return {
      statusCode,
      description: (r.description as string) || '',
      schemaRef,
    };
  });
}

/**
 * Parse request body from OpenAPI path operation
 */
function parseRequestBody(requestBody: Record<string, unknown> | undefined): RequestBody | undefined {
  if (!requestBody) return undefined;

  let schemaRef = '';
  let contentType = 'application/json';

  if (requestBody.content && typeof requestBody.content === 'object') {
    const content = requestBody.content as Record<string, unknown>;
    // Get the first content type
    const contentTypes = Object.keys(content);
    if (contentTypes.length > 0) {
      contentType = contentTypes[0];
      const mediaType = content[contentType] as Record<string, unknown>;
      if (mediaType.schema) {
        const schema = mediaType.schema as Record<string, unknown>;
        if (schema.$ref) {
          schemaRef = extractSchemaRef(schema.$ref as string);
        }
      }
    }
  }

  return {
    description: (requestBody.description as string) || '',
    required: (requestBody.required as boolean) ?? true,
    schemaRef,
    contentType,
  };
}

/**
 * Parse paths from OpenAPI format
 */
function parsePaths(
  paths: Record<string, Record<string, unknown>> | undefined,
  globalSecurity: Array<Record<string, unknown[]>> | undefined
): SwaggerPath[] {
  if (!paths) return [];

  const result: SwaggerPath[] = [];
  const httpMethods = ['get', 'post', 'put', 'delete', 'patch', 'options', 'head', 'trace'];

  for (const [pathKey, pathItem] of Object.entries(paths)) {
    const operations: PathOperation[] = [];

    for (const method of httpMethods) {
      if (pathItem[method]) {
        const operation = pathItem[method] as Record<string, unknown>;

        // Parse security - use operation security or fall back to global
        const operationSecurity = operation.security as Array<Record<string, unknown[]>> | undefined;
        const securityToUse = operationSecurity ?? globalSecurity;
        const security = securityToUse
          ? securityToUse.flatMap((s) => Object.keys(s))
          : [];

        // Parse tags
        const tags = (operation.tags as string[]) || [];

        const pathOperation: PathOperation = {
          method: method as PathOperation['method'],
          tags,
          summary: (operation.summary as string) || '',
          operationId: (operation.operationId as string) || '',
          description: (operation.description as string) || '',
          parameters: parseParameters(operation.parameters as unknown[]),
          responses: parseResponses(operation.responses as Record<string, unknown>),
          requestBody: parseRequestBody(operation.requestBody as Record<string, unknown>),
          security: security.length > 0 ? security : undefined,
        };

        operations.push(pathOperation);
      }
    }

    if (operations.length > 0) {
      result.push({
        path: pathKey,
        operations,
      });
    }
  }

  return result;
}

/**
 * Import an OpenAPI YAML document and convert it to SwaggerDocument format
 */
export function importYamlDocument(yamlContent: string): ImportResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Parse YAML
  let parsed: OpenApiDocument;
  try {
    parsed = yaml.parse(yamlContent) as OpenApiDocument;
  } catch (e) {
    const error = e as Error;
    return {
      success: false,
      errors: [`YAML Parse Error: ${error.message}`],
      warnings: [],
    };
  }

  if (!parsed || typeof parsed !== 'object') {
    return {
      success: false,
      errors: ['Invalid document: must be an object'],
      warnings: [],
    };
  }

  // Check for required fields
  if (!parsed.openapi) {
    errors.push('Missing required field: openapi');
  }

  if (!parsed.info?.title) {
    warnings.push('Missing info.title - will be empty');
  }

  // Build the SwaggerDocument
  const info: SwaggerInfo = {
    title: parsed.info?.title || '',
    description: parsed.info?.description || '',
    version: parsed.info?.version || '1.0.0',
  };

  const servers: SwaggerServer[] = (parsed.servers || []).map((s) => ({
    url: s.url || '',
    description: s.description || '',
  }));

  const tags: SwaggerTag[] = (parsed.tags || []).map((t) => ({
    name: t.name || '',
    description: t.description || '',
  }));

  const securitySchemes = parseSecuritySchemes(parsed.components?.securitySchemes);
  const schemas = parseSchemas(parsed.components?.schemas);
  const paths = parsePaths(parsed.paths, parsed.security);

  // Add warnings for unsupported features
  if (parsed.components) {
    const components = parsed.components as Record<string, unknown>;
    const unsupportedComponents = ['responses', 'parameters', 'examples', 'requestBodies', 'headers', 'links', 'callbacks'];
    for (const comp of unsupportedComponents) {
      if (components[comp]) {
        warnings.push(`Component "${comp}" is not fully supported and may not be imported correctly`);
      }
    }
  }

  const document: SwaggerDocument = {
    openapi: parsed.openapi || '3.0.0',
    info,
    servers,
    securitySchemes,
    tags,
    paths,
    schemas,
  };

  return {
    success: errors.length === 0,
    document,
    errors,
    warnings,
  };
}
