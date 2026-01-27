import type { SwaggerSchema } from '../types/swagger';

export const schemaTemplates: Record<string, SwaggerSchema> = {
  jsonApiVersion: {
    name: 'JsonApiVersion',
    type: 'object',
    isTemplate: true,
    properties: [
      { name: 'version', type: 'string', description: 'JSON API version', example: '1.0', $ref: '', items: { type: 'string', $ref: '' }, enumValues: '' },
    ],
  },
  errorDetail: {
    name: 'ErrorDetail',
    type: 'object',
    isTemplate: true,
    properties: [
      { name: 'status', type: 'string', description: 'HTTP status code of the error', example: '401', $ref: '', items: { type: 'string', $ref: '' }, enumValues: '' },
      { name: 'code', type: 'string', description: 'Application-specific error code', example: '02x102', $ref: '', items: { type: 'string', $ref: '' }, enumValues: '' },
      { name: 'id', type: 'string', description: 'Unique identifier for the error', example: '2897ff46-271a-4add-a5b7-8e569bab7352', $ref: '', items: { type: 'string', $ref: '' }, enumValues: '' },
    ],
  },
  error: {
    name: 'Error',
    type: 'object',
    isTemplate: true,
    properties: [
      { name: 'jsonapi', type: 'object', description: 'JSON API version information', example: '', $ref: 'JsonApiVersion', items: { type: 'string', $ref: '' }, enumValues: '' },
      { name: 'errors', type: 'array', description: 'List of errors', example: '', $ref: '', items: { type: 'object', $ref: 'ErrorDetail' }, enumValues: '' },
    ],
  },
  pagination: {
    name: 'Pagination',
    type: 'object',
    isTemplate: true,
    properties: [
      { name: 'page', type: 'integer', description: 'Current page number', example: '1', $ref: '', items: { type: 'string', $ref: '' }, enumValues: '' },
      { name: 'pageSize', type: 'integer', description: 'Number of items per page', example: '20', $ref: '', items: { type: 'string', $ref: '' }, enumValues: '' },
      { name: 'totalPages', type: 'integer', description: 'Total number of pages', example: '10', $ref: '', items: { type: 'string', $ref: '' }, enumValues: '' },
      { name: 'totalItems', type: 'integer', description: 'Total number of items', example: '200', $ref: '', items: { type: 'string', $ref: '' }, enumValues: '' },
    ],
  },
};