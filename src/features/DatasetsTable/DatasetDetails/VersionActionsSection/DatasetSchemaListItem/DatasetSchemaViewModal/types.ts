import { type DatasetSchemaGetResponse } from "@squonk/data-manager-client";

import { type JSON_SCHEMA_TYPE } from "../../../../../../utils/app/jsonSchema";

// These types should be defined in the OpenAPI but currently aren't
export interface Field {
  description: string;
  type: JSON_SCHEMA_TYPE;
}
export type Fields = Record<string, Field>;
export type FieldKey = keyof Field;
export type FieldValue<K extends FieldKey> = Field[K];

export type TypedSchema = DatasetSchemaGetResponse & { fields: Fields };
