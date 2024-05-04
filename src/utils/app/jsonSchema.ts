export const JSON_SCHEMA_TYPES = [
  "string",
  "number",
  "integer",
  "object",
  "array",
  "boolean",
  "null",
] as const;

export type JSON_SCHEMA_TYPE = (typeof JSON_SCHEMA_TYPES)[number];
