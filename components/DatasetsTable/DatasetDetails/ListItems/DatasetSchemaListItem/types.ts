import type { JSON_SCHEMA_TYPES } from './constants';

// These types should be defined in the OpenAPI but currently aren't
// TODO: replace these with types of data-manager-client when they exist there
export interface Field {
  description: string;
  type: typeof JSON_SCHEMA_TYPES; // These will be replaced with JSON Schema types
}
export type Fields = Record<string, Field>;
export type FieldKey = keyof Field;
