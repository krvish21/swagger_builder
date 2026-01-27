import type { SchemaProperty } from '../types/swagger';

export const parseJsonToProperties = (json: Record<string, unknown>): SchemaProperty[] => {
  const properties: SchemaProperty[] = [];

  for (const [key, value] of Object.entries(json)) {
    const prop: SchemaProperty = {
      name: key,
      type: 'string',
      description: '',
      example: '',
      $ref: '',
      items: { type: 'string', $ref: '' },
      enumValues: '',
    };

    if (value === null) {
      prop.type = 'string';
      prop.example = '';
    } else if (Array.isArray(value)) {
      prop.type = 'array';
      if (value.length > 0 && typeof value[0] === 'object') {
        prop.items = { type: 'object', $ref: '' };
      } else {
        prop.items = { type: typeof value[0] === 'number' ? 'number' : 'string', $ref: '' };
      }
    } else if (typeof value === 'object') {
      prop.type = 'object';
    } else if (typeof value === 'number') {
      prop.type = Number.isInteger(value) ? 'integer' : 'number';
      prop.example = String(value);
    } else if (typeof value === 'boolean') {
      prop.type = 'boolean';
      prop.example = String(value);
    } else {
      prop.type = 'string';
      prop.example = String(value);
    }

    properties.push(prop);
  }

  return properties;
};