import { useState, useEffect, useRef, useCallback } from 'react';
import type {
  SwaggerDocument,
  SwaggerTag,
  SwaggerPath,
  PathOperation,
  PathParameter,
  PathResponse,
  SwaggerSchema,
  SchemaProperty,
  SwaggerServer,
  SwaggerSecurityScheme,
  RequestBody,
} from '../types/swagger';
import { generateOperationId } from '../utils/operationIdGenerator';
import { schemaTemplates } from '../utils/schemaTemplates';
import { syncPathParameters } from '../utils/pathParameterParser';
import { saveDocument, loadDocument, clearDocument } from '../utils/localStorage';

const initialDocument: SwaggerDocument = {
  openapi: '3.0.0',
  info: {
    title: '',
    description: '',
    version: '1.0.0',
  },
  servers: [],
  securitySchemes: [],
  tags: [],
  paths: [],
  schemas: [],
};

// Migrate old path format to new format if needed
// Migrate old path format to new format if needed
const migrateDocument = (doc: SwaggerDocument): SwaggerDocument => {
  return {
    ...doc,
    paths: doc.paths.map((path) => {
      // If operations array already exists, return as-is
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (Array.isArray((path as any).operations)) {
        return path;
      }
      // Migrate old format to new format (old format had method property)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const oldPath = path as any;
      if (oldPath.method && typeof oldPath.method === 'string') {
        const operation: PathOperation = {
          method: oldPath.method as PathOperation['method'],
          tags: (oldPath.tags as string[]) || [],
          summary: (oldPath.summary as string) || '',
          operationId: (oldPath.operationId as string) || '',
          description: (oldPath.description as string) || '',
          parameters: (oldPath.parameters as PathParameter[]) || [],
          responses: (oldPath.responses as PathResponse[]) || [],
          requestBody: oldPath.requestBody as RequestBody | undefined,
          security: (oldPath.security as string[]) || undefined,
          deprecated: oldPath.deprecated as boolean | undefined,
        };
        return {
          path: oldPath.path as string,
          operations: [operation],
        };
      }
      return path;
    }),
  };
};

// Load initial document from LocalStorage or use default
const getInitialDocument = (): { document: SwaggerDocument; lastSaved: Date | null; wasRestored: boolean } => {
  const stored = loadDocument();
  if (stored) {
    return {
      document: migrateDocument(stored.document),
      lastSaved: stored.lastSaved,
      wasRestored: true,
    };
  }
  return {
    document: initialDocument,
    lastSaved: null,
    wasRestored: false,
  };
};

export const useSwaggerDocument = () => {
  const [document, setDocument] = useState<SwaggerDocument>(() => {
    const initial = getInitialDocument();
    return initial.document;
  });
  const [lastSaved, setLastSaved] = useState<Date | null>(() => {
    const initial = getInitialDocument();
    return initial.lastSaved;
  });
  const [wasRestored, setWasRestored] = useState<boolean>(() => {
    const initial = getInitialDocument();
    return initial.wasRestored;
  });
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-save with debounce
  const debouncedSave = useCallback((doc: SwaggerDocument) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(() => {
      const success = saveDocument(doc);
      if (success) {
        setLastSaved(new Date());
      }
    }, 1000); // Save after 1 second of inactivity
  }, []);

  // Trigger auto-save whenever document changes
  useEffect(() => {
    debouncedSave(document);
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [document, debouncedSave]);

  // Clear the "was restored" flag after initial render
  useEffect(() => {
    if (wasRestored) {
      const timeout = setTimeout(() => setWasRestored(false), 3000);
      return () => clearTimeout(timeout);
    }
  }, [wasRestored]);

  // Import/Reset handlers
  const importDocument = (doc: SwaggerDocument) => {
    const migratedDoc = migrateDocument(doc);
    setDocument(migratedDoc);
    // Immediately save imported document
    saveDocument(migratedDoc);
    setLastSaved(new Date());
  };

  const resetDocument = () => {
    setDocument(initialDocument);
    clearDocument();
    setLastSaved(null);
  };

  const clearStoredDocument = () => {
    clearDocument();
    setLastSaved(null);
  };

  // Info handlers
  const updateInfo = (field: string, value: string) => {
    setDocument((prev) => ({
      ...prev,
      info: { ...prev.info, [field]: value },
    }));
  };

  const updateContact = (field: string, value: string) => {
    setDocument((prev) => ({
      ...prev,
      info: {
        ...prev.info,
        contact: { ...prev.info.contact, [field]: value },
      },
    }));
  };

  const updateLicense = (field: string, value: string) => {
    setDocument((prev) => ({
      ...prev,
      info: {
        ...prev.info,
        license: { ...prev.info.license, name: prev.info.license?.name || '', [field]: value },
      },
    }));
  };

  // Tags handlers
  const addTag = () => {
    setDocument((prev) => ({
      ...prev,
      tags: [...prev.tags, { name: '', description: '' }],
    }));
  };

  const updateTag = (index: number, field: keyof SwaggerTag, value: string) => {
    setDocument((prev) => ({
      ...prev,
      tags: prev.tags.map((tag, i) =>
        i === index ? { ...tag, [field]: value } : tag
      ),
    }));
  };

  const removeTag = (index: number) => {
    setDocument((prev) => ({
      ...prev,
      tags: prev.tags.filter((_, i) => i !== index),
    }));
  };

  const reorderTags = (oldIndex: number, newIndex: number) => {
    setDocument((prev) => {
      const newTags = [...prev.tags];
      const [removed] = newTags.splice(oldIndex, 1);
      newTags.splice(newIndex, 0, removed);
      return { ...prev, tags: newTags };
    });
  };

  // Server handlers
  const addServer = () => {
    setDocument((prev) => ({
      ...prev,
      servers: [...prev.servers, { url: '', description: '' }],
    }));
  };

  const updateServer = (index: number, field: keyof SwaggerServer, value: string) => {
    setDocument((prev) => ({
      ...prev,
      servers: prev.servers.map((server, i) =>
        i === index ? { ...server, [field]: value } : server
      ),
    }));
  };

  const removeServer = (index: number) => {
    setDocument((prev) => ({
      ...prev,
      servers: prev.servers.filter((_, i) => i !== index),
    }));
  };

  // Security Scheme handlers
  const addSecurityScheme = () => {
    const newScheme: SwaggerSecurityScheme = {
      name: '',
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
    };
    setDocument((prev) => ({
      ...prev,
      securitySchemes: [...prev.securitySchemes, newScheme],
    }));
  };

  const addCognitoSecurityScheme = () => {
    const cognitoScheme: SwaggerSecurityScheme = {
      name: 'Cognito',
      type: 'apiKey',
      in: 'header',
      apiKeyName: 'Authorization',
    };
    setDocument((prev) => ({
      ...prev,
      securitySchemes: [...prev.securitySchemes, cognitoScheme],
    }));
  };

  const updateSecurityScheme = (index: number, field: keyof SwaggerSecurityScheme, value: string) => {
    setDocument((prev) => ({
      ...prev,
      securitySchemes: prev.securitySchemes.map((scheme, i) =>
        i === index ? { ...scheme, [field]: value } : scheme
      ),
    }));
  };

  const removeSecurityScheme = (index: number) => {
    setDocument((prev) => ({
      ...prev,
      securitySchemes: prev.securitySchemes.filter((_, i) => i !== index),
    }));
  };

  // Path handlers
  const addPath = () => {
    const newOperation: PathOperation = {
      method: 'get',
      tags: [],
      summary: '',
      operationId: '',
      description: '',
      parameters: [],
      responses: [],
    };
    const newPath: SwaggerPath = {
      path: '',
      operations: [newOperation],
    };
    setDocument((prev) => ({
      ...prev,
      paths: [...prev.paths, newPath],
    }));
  };

  const updatePath = (index: number, field: string, value: unknown) => {
    setDocument((prev) => ({
      ...prev,
      paths: prev.paths.map((path, i) => {
        if (i !== index) return path;

        if (field === 'path') {
          // Sync path parameters for all operations when path changes
          const newPathStr = value as string;
          return {
            ...path,
            path: newPathStr,
            operations: path.operations.map((op) => ({
              ...op,
              parameters: syncPathParameters(op.parameters, newPathStr),
            })),
          };
        }

        return path;
      }),
    }));
  };

  const removePath = (index: number) => {
    setDocument((prev) => ({
      ...prev,
      paths: prev.paths.filter((_, i) => i !== index),
    }));
  };

  const addOperation = (pathIndex: number, method: PathOperation['method']) => {
    setDocument((prev) => ({
      ...prev,
      paths: prev.paths.map((path, i) => {
        if (i !== pathIndex) return path;

        // Check if method already exists
        if (path.operations.some((op) => op.method === method)) {
          return path; // Method already exists, don't add
        }

        const newOperation: PathOperation = {
          method,
          tags: [],
          summary: '',
          operationId: generateOperationId(method, path.path),
          description: '',
          parameters: syncPathParameters([], path.path),
          responses: [],
        };
        return {
          ...path,
          operations: [...path.operations, newOperation],
        };
      }),
    }));
  };

  const removeOperation = (pathIndex: number, operationIndex: number) => {
    setDocument((prev) => ({
      ...prev,
      paths: prev.paths
        .map((path, i) => {
          if (i !== pathIndex) return path;
          const filteredOps = path.operations.filter((_, j) => j !== operationIndex);
          return { ...path, operations: filteredOps };
        })
        .filter((path) => path.operations.length > 0), // Remove path if no operations left
    }));
  };

  const duplicatePath = (pathIndex: number, operationIndex: number) => {
    const path = document.paths[pathIndex];
    const operation = path.operations[operationIndex];

    // Find the next available method
    const availableMethods: PathOperation['method'][] = ['get', 'post', 'put', 'patch', 'delete'];
    const usedMethods = new Set(path.operations.map((op) => op.method));
    const nextMethod = availableMethods.find((m) => !usedMethods.has(m));

    if (!nextMethod) {
      // All methods are used, create a duplicate path instead
      const newPath: SwaggerPath = {
        path: `${path.path}_copy`,
        operations: [
          {
            ...operation,
            operationId: `${operation.operationId}_copy`,
            parameters: operation.parameters.map((p) => ({ ...p })),
            responses: operation.responses.map((r) => ({ ...r })),
          },
        ],
      };
      setDocument((prev) => ({
        ...prev,
        paths: [...prev.paths, newPath],
      }));
    } else {
      // Add as new method to same path
      const newOperation: PathOperation = {
        ...operation,
        method: nextMethod,
        operationId: generateOperationId(nextMethod, path.path),
        parameters: operation.parameters.map((p) => ({ ...p })),
        responses: operation.responses.map((r) => ({ ...r })),
      };
      setDocument((prev) => ({
        ...prev,
        paths: prev.paths.map((p, i) => {
          if (i !== pathIndex) return p;
          return { ...p, operations: [...p.operations, newOperation] };
        }),
      }));
    }
  };

  const reorderPaths = (startIndex: number, endIndex: number) => {
    const result = Array.from(document.paths);
    const [removed] = result.splice(startIndex, 1);
    result.splice(endIndex, 0, removed);
    setDocument((prev) => ({
      ...prev,
      paths: result,
    }));
  };

  // Parameter handlers
  const addParameter = (pathIndex: number, operationIndex: number) => {
    const newParam: PathParameter = {
      name: '',
      in: 'path',
      description: '',
      required: true,
      type: 'string',
    };
    setDocument((prev) => ({
      ...prev,
      paths: prev.paths.map((path, i) =>
        i === pathIndex
          ? {
            ...path,
            operations: path.operations.map((op, j) =>
              j === operationIndex
                ? { ...op, parameters: [...op.parameters, newParam] }
                : op
            ),
          }
          : path
      ),
    }));
  };

  const updateParameter = (
    pathIndex: number,
    operationIndex: number,
    paramIndex: number,
    field: keyof PathParameter,
    value: unknown
  ) => {
    setDocument((prev) => ({
      ...prev,
      paths: prev.paths.map((path, i) =>
        i === pathIndex
          ? {
            ...path,
            operations: path.operations.map((op, j) =>
              j === operationIndex
                ? {
                  ...op,
                  parameters: op.parameters.map((param, k) =>
                    k === paramIndex ? { ...param, [field]: value } : param
                  ),
                }
                : op
            ),
          }
          : path
      ),
    }));
  };

  const removeParameter = (pathIndex: number, operationIndex: number, paramIndex: number) => {
    setDocument((prev) => ({
      ...prev,
      paths: prev.paths.map((path, i) =>
        i === pathIndex
          ? {
            ...path,
            operations: path.operations.map((op, j) =>
              j === operationIndex
                ? {
                  ...op,
                  parameters: op.parameters.filter((_, k) => k !== paramIndex),
                }
                : op
            ),
          }
          : path
      ),
    }));
  };

  // Response handlers
  const addResponse = (pathIndex: number, operationIndex: number) => {
    const newResponse: PathResponse = {
      statusCode: '200',
      description: '',
      schemaRef: '',
    };
    setDocument((prev) => ({
      ...prev,
      paths: prev.paths.map((path, i) =>
        i === pathIndex
          ? {
            ...path,
            operations: path.operations.map((op, j) =>
              j === operationIndex
                ? { ...op, responses: [...op.responses, newResponse] }
                : op
            ),
          }
          : path
      ),
    }));
  };

  const updateResponse = (
    pathIndex: number,
    operationIndex: number,
    respIndex: number,
    field: keyof PathResponse,
    value: string
  ) => {
    setDocument((prev) => ({
      ...prev,
      paths: prev.paths.map((path, i) =>
        i === pathIndex
          ? {
            ...path,
            operations: path.operations.map((op, j) =>
              j === operationIndex
                ? {
                  ...op,
                  responses: op.responses.map((resp, k) =>
                    k === respIndex ? { ...resp, [field]: value } : resp
                  ),
                }
                : op
            ),
          }
          : path
      ),
    }));
  };

  const removeResponse = (pathIndex: number, operationIndex: number, respIndex: number) => {
    setDocument((prev) => ({
      ...prev,
      paths: prev.paths.map((path, i) =>
        i === pathIndex
          ? {
            ...path,
            operations: path.operations.map((op, j) =>
              j === operationIndex
                ? {
                  ...op,
                  responses: op.responses.filter((_, k) => k !== respIndex),
                }
                : op
            ),
          }
          : path
      ),
    }));
  };

  const addCommonErrorResponses = (pathIndex: number, operationIndex: number) => {
    const errorSchema = document.schemas.find((s) => s.name === 'Error');
    const schemaRef = errorSchema ? 'Error' : '';

    const commonResponses: PathResponse[] = [
      { statusCode: '400', description: 'Bad request - Invalid parameters', schemaRef },
      { statusCode: '401', description: 'Unauthorized - Invalid or missing authentication token', schemaRef },
      { statusCode: '403', description: 'Forbidden - Access denied', schemaRef },
      { statusCode: '404', description: 'Not found - Resource does not exist', schemaRef },
      { statusCode: '500', description: 'Internal server error - An unexpected error occurred', schemaRef },
    ];

    setDocument((prev) => ({
      ...prev,
      paths: prev.paths.map((path, i) =>
        i === pathIndex
          ? {
            ...path,
            operations: path.operations.map((op, j) =>
              j === operationIndex
                ? { ...op, responses: [...op.responses, ...commonResponses] }
                : op
            ),
          }
          : path
      ),
    }));
  };

  // Request Body handlers
  const updateRequestBody = (
    pathIndex: number,
    operationIndex: number,
    field: keyof RequestBody,
    value: unknown
  ) => {
    setDocument((prev) => ({
      ...prev,
      paths: prev.paths.map((path, i) =>
        i === pathIndex
          ? {
            ...path,
            operations: path.operations.map((op, j) =>
              j === operationIndex
                ? {
                  ...op,
                  requestBody: { ...op.requestBody, [field]: value } as RequestBody,
                }
                : op
            ),
          }
          : path
      ),
    }));
  };

  const addRequestBody = (pathIndex: number, operationIndex: number) => {
    const newRequestBody: RequestBody = {
      description: '',
      required: true,
      schemaRef: '',
      contentType: 'application/json',
    };
    setDocument((prev) => ({
      ...prev,
      paths: prev.paths.map((path, i) =>
        i === pathIndex
          ? {
            ...path,
            operations: path.operations.map((op, j) =>
              j === operationIndex
                ? { ...op, requestBody: newRequestBody }
                : op
            ),
          }
          : path
      ),
    }));
  };

  const removeRequestBody = (pathIndex: number, operationIndex: number) => {
    setDocument((prev) => ({
      ...prev,
      paths: prev.paths.map((path, i) =>
        i === pathIndex
          ? {
            ...path,
            operations: path.operations.map((op, j) =>
              j === operationIndex
                ? { ...op, requestBody: undefined }
                : op
            ),
          }
          : path
      ),
    }));
  };

  // Schema handlers
  const addSchema = () => {
    const newSchema: SwaggerSchema = {
      name: '',
      type: 'object',
      properties: [],
    };
    setDocument((prev) => ({
      ...prev,
      schemas: [...prev.schemas, newSchema],
    }));
  };

  const addTemplateSchema = (templateKey: string) => {
    const template = schemaTemplates[templateKey];
    if (template) {
      setDocument((prev) => ({
        ...prev,
        schemas: [...prev.schemas, template],
      }));
    }
  };

  const updateSchema = (index: number, field: keyof SwaggerSchema, value: unknown) => {
    setDocument((prev) => ({
      ...prev,
      schemas: prev.schemas.map((schema, i) =>
        i === index ? { ...schema, [field]: value } : schema
      ),
    }));
  };

  const removeSchema = (index: number) => {
    setDocument((prev) => ({
      ...prev,
      schemas: prev.schemas.filter((_, i) => i !== index),
    }));
  };

  const duplicateSchema = (index: number) => {
    const schema = document.schemas[index];
    const newSchema = {
      ...schema,
      name: `${schema.name}_copy`,
      properties: schema.properties.map((p) => ({ ...p })),
    };
    setDocument((prev) => ({
      ...prev,
      schemas: [...prev.schemas, newSchema],
    }));
  };

  const reorderSchemas = (startIndex: number, endIndex: number) => {
    const result = Array.from(document.schemas);
    const [removed] = result.splice(startIndex, 1);
    result.splice(endIndex, 0, removed);
    setDocument((prev) => ({
      ...prev,
      schemas: result,
    }));
  };

  // Schema Property handlers
  const addSchemaProperty = (schemaIndex: number) => {
    const newProperty: SchemaProperty = {
      name: '',
      type: 'string',
      description: '',
      example: '',
      required: false,
    };
    setDocument((prev) => ({
      ...prev,
      schemas: prev.schemas.map((schema, i) =>
        i === schemaIndex
          ? { ...schema, properties: [...schema.properties, newProperty] }
          : schema
      ),
    }));
  };

  const updateSchemaProperty = (
    schemaIndex: number,
    propertyIndex: number,
    field: keyof SchemaProperty,
    value: unknown
  ) => {
    setDocument((prev) => ({
      ...prev,
      schemas: prev.schemas.map((schema, i) =>
        i === schemaIndex
          ? {
            ...schema,
            properties: schema.properties.map((property, j) =>
              j === propertyIndex ? { ...property, [field]: value } : property
            ),
          }
          : schema
      ),
    }));
  };

  const removeSchemaProperty = (schemaIndex: number, propertyIndex: number) => {
    setDocument((prev) => ({
      ...prev,
      schemas: prev.schemas.map((schema, i) =>
        i === schemaIndex
          ? {
            ...schema,
            properties: schema.properties.filter((_, j) => j !== propertyIndex),
          }
          : schema
      ),
    }));
  };

  return {
    document,
    // Auto-save state
    lastSaved,
    wasRestored,
    // Import/Reset
    importDocument,
    resetDocument,
    clearStoredDocument,
    // Info
    updateInfo,
    updateContact,
    updateLicense,
    // Tags
    addTag,
    updateTag,
    removeTag,
    reorderTags,
    // Servers
    addServer,
    updateServer,
    removeServer,
    // Security Schemes
    addSecurityScheme,
    addCognitoSecurityScheme,
    updateSecurityScheme,
    removeSecurityScheme,
    // Paths
    addPath,
    updatePath,
    removePath,
    addOperation,
    removeOperation,
    duplicatePath,
    reorderPaths,
    // Parameters
    addParameter,
    updateParameter,
    removeParameter,
    // Responses
    addResponse,
    updateResponse,
    removeResponse,
    addCommonErrorResponses,
    // Request Body
    addRequestBody,
    updateRequestBody,
    removeRequestBody,
    // Schemas
    addSchema,
    addTemplateSchema,
    updateSchema,
    removeSchema,
    duplicateSchema,
    reorderSchemas,
    // Schema Properties
    addSchemaProperty,
    updateSchemaProperty,
    removeSchemaProperty,
  };
};