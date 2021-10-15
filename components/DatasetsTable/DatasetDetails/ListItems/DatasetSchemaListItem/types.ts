import type { DatasetSchemaGetResponse } from '@squonk/data-manager-client';

import type { JSON_SCHEMA_TYPES } from './constants';

export type JSONSchemaType = typeof JSON_SCHEMA_TYPES[number];

// These types should be defined in the OpenAPI but currently aren't
export interface Field {
  description: string;
  type: JSONSchemaType;
}
export type Fields = Record<string, Field>;
export type FieldKey = keyof Field;
export type FieldValue<K extends FieldKey> = Field[K];

export type TypedSchema = { fields: Fields } & DatasetSchemaGetResponse;

export type TableSchemaView = {
  name: string;
  description: {
    original: string;
    current: string;
  };
  type: {
    original: JSONSchemaType;
    current: JSONSchemaType;
  };
};
