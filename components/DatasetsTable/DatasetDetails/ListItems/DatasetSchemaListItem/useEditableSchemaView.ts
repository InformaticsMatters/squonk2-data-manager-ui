import { useCallback, useEffect, useMemo, useReducer } from 'react';

import type { DatasetSchemaGetResponse } from '@squonk/data-manager-client';

import type { JSON_SCHEMA_TYPES } from './constants';

// These types should be defined in the OpenAPI but currently aren't
// TODO: replace these with types of data-manager-client when they exist there
interface Field {
  description: string;
  type: typeof JSON_SCHEMA_TYPES[number]; // These will be replaced with JSON Schema types
}
type Fields = Record<string, Field>;
type FieldKey = keyof Field;
type FieldValue<K extends FieldKey> = Field[K];

type TypedSchema = { fields: Fields } & DatasetSchemaGetResponse;

type EditableSchemaStateAction<K extends FieldKey, V extends FieldValue<K>> =
  | { type: 'clear' }
  | { type: 'init'; originalSchema: TypedSchema }
  | { type: 'changeField'; field: string; fieldKey: K; value: V };

type EditedSchemaProps = {
  fields: Partial<Record<string, Partial<Field>>>;
};

type EditableSchemaState = {
  originalSchema: TypedSchema;
  editedSchemaProps: EditedSchemaProps;
} | null;

const editableSchemaReducer = <K extends FieldKey, V extends FieldValue<K>>(
  state: EditableSchemaState,
  action: EditableSchemaStateAction<K, V>,
): EditableSchemaState => {
  switch (action.type) {
    case 'clear': {
      return null;
    }
    case 'init': {
      return {
        originalSchema: action.originalSchema,
        editedSchemaProps: {
          fields: {},
        },
      };
    }
    case 'changeField': {
      if (state) {
        const { field, fieldKey, value } = action;
        const editedSchemaProps = { ...state.editedSchemaProps };

        const editedField = editedSchemaProps.fields[field] || {};

        if (state.originalSchema.fields[field][fieldKey] === value) {
          delete editedField[fieldKey];

          if (!Object.keys(editedField).length) {
            delete editedSchemaProps.fields[field];
          }
        } else {
          editedField[fieldKey] = value;
        }

        editedSchemaProps.fields[field] = editedField;

        return {
          ...state,
          editedSchemaProps,
        };
      }
      return state;
    }
    default:
      return state;
  }
};

export const useEditableSchemaView = (schema?: DatasetSchemaGetResponse) => {
  const [editableSchemaState, dispatch] = useReducer(editableSchemaReducer, null);

  useEffect(() => {
    if (schema) {
      // Need to assert the fields here as the OpenAPI types are wrong
      const originalSchema = schema as TypedSchema;
      dispatch({ type: 'init', originalSchema });
    } else {
      dispatch({ type: 'clear' });
    }
  }, [schema]);

  const changeSchemaDescription = useCallback(
    <K extends FieldKey, V extends FieldValue<K>>(field: string, fieldKey: K, value: V) => {
      dispatch({ type: 'changeField', field, fieldKey, value });
    },
    [],
  );

  // Table data so we memoize it for react-table
  const fields = useMemo(() => {
    if (editableSchemaState) {
      const { originalSchema, editedSchemaProps } = editableSchemaState;
      return Object.entries(originalSchema.fields).map((fieldEntry) => {
        const [name, field] = fieldEntry;
        return {
          name,
          description: {
            original: field.description,
            current: editedSchemaProps.fields[name]?.description || field.description,
          },
          type: {
            original: field.type,
            current: editedSchemaProps.fields[name]?.type || field.type,
          },
        };
      });
    }
    return undefined;
  }, [editableSchemaState]);

  return { fields, changeSchemaDescription };
};
