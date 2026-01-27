export interface SwaggerContact {
  name?: string;
  url?: string;
  email?: string;
}

export interface SwaggerLicense {
  name: string;
  url?: string;
}

export interface SwaggerInfo {
  title: string;
  description: string;
  version: string;
  termsOfService?: string;
  contact?: SwaggerContact;
  license?: SwaggerLicense;
}

export interface SwaggerServerVariable {
  default: string;
  description?: string;
  enum?: string[];
}

export interface SwaggerServer {
  url: string;
  description: string;
  variables?: Record<string, SwaggerServerVariable>;
}

export interface SwaggerSecurityScheme {
  name: string;
  type: 'http' | 'apiKey' | 'oauth2' | 'openIdConnect';
  scheme?: string; // for http type: 'bearer', 'basic'
  bearerFormat?: string; // e.g., 'JWT'
  in?: 'header' | 'query' | 'cookie'; // for apiKey type
  apiKeyName?: string; // the name of the header/query/cookie for apiKey
}

export interface SwaggerTag {
  name: string;
  description: string;
}

export interface SchemaProperty {
  name: string;
  type: '' | 'string' | 'number' | 'integer' | 'boolean' | 'array' | 'object';
  format?: string;
  description: string;
  example: string;
  required?: boolean;
  nullable?: boolean;
  readOnly?: boolean;
  writeOnly?: boolean;
  deprecated?: boolean;
  minLength?: number;
  maxLength?: number;
  minimum?: number;
  maximum?: number;
  pattern?: string;
  default?: string;
  $ref?: string; // Reference to another schema when type is 'object' or 'array'
  items?: {
    type?: string;
    $ref?: string;
  }; // For array types - defines the type of items
  enumValues?: string; // Raw comma-separated enum values (stored as string for easier editing)
}

export interface SwaggerSchema {
  name: string;
  type: 'object' | 'array';
  properties: SchemaProperty[];
  isTemplate?: boolean; // Flag to indicate if this is a prepopulated template schema
}

export interface PathParameter {
  name: string;
  in: 'path' | 'query' | 'header' | 'cookie';
  description: string;
  required: boolean;
  type: string;
  format?: string;
  enum?: string;
  example?: string;
  default?: string;
  deprecated?: boolean;
}

export interface ResponseHeader {
  name: string;
  description: string;
  schema: {
    type: string;
  };
}

export interface PathResponse {
  statusCode: string;
  description: string;
  schemaRef: string;
  contentType?: string;
  headers?: ResponseHeader[];
}

export interface RequestBody {
  description: string;
  required: boolean;
  schemaRef: string;
  contentType: string;
}

export interface PathOperation {
  method: 'get' | 'post' | 'put' | 'delete' | 'patch';
  tags: string[];
  summary: string;
  operationId: string;
  description: string;
  deprecated?: boolean;
  parameters: PathParameter[];
  responses: PathResponse[];
  requestBody?: RequestBody;
  security?: string[]; // Names of security schemes to apply
}

export interface SwaggerPath {
  path: string;
  operations: PathOperation[];
}

export interface SwaggerDocument {
  openapi: string;
  info: SwaggerInfo;
  servers: SwaggerServer[];
  securitySchemes: SwaggerSecurityScheme[];
  tags: SwaggerTag[];
  paths: SwaggerPath[];
  schemas: SwaggerSchema[];
}