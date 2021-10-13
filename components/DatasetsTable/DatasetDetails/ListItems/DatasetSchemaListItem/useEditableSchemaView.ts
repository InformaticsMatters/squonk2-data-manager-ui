import { useCallback, useEffect, useMemo, useReducer } from 'react';

import type { DatasetSchemaGetResponse } from '@squonk/data-manager-client';

import type { Field, FieldKey, Fields } from './types';

type TypedSchema = ({ fields: Fields } & DatasetSchemaGetResponse) | undefined;
type EditableSchemaAction =
  | { type: 'init'; schema: TypedSchema }
  | { type: 'changeField'; field: string; fieldKey: FieldKey; value: Field[FieldKey] };

const editableSchemaReducer = (state: TypedSchema, action: EditableSchemaAction): TypedSchema => {
  switch (action.type) {
    case 'init': {
      return action.schema;
    }
    case 'changeField': {
      if (state) {
        return {
          ...state,
          fields: {
            ...state.fields,
            [action.field]: {
              ...state.fields[action.field],
              [action.fieldKey]: action.value,
            },
          },
        };
      }
      return state;
    }
    default:
      break;
  }
};

export const useEditableSchemaView = (schema?: DatasetSchemaGetResponse) => {
  // Need to assert the fields here as the OpenAPI types are wrong
  const originalSchema = schema as TypedSchema;

  const [editableSchema, dispatch] = useReducer(editableSchemaReducer, undefined);

  useEffect(() => {
    const schema = originalSchema ? JSON.parse(JSON.stringify(originalSchema)) : undefined;
    dispatch({ type: 'init', schema });
  }, [originalSchema]);

  const changeSchemaDescription = useCallback(
    (field: string, fieldKey: FieldKey, value: Field[FieldKey]) => {
      dispatch({ type: 'changeField', field, fieldKey, value });
    },
    [],
  );

  const wasSchemaUpdated = <K extends keyof Field>(schemaField: string, attribute: K) => {
    return (
      originalSchema?.fields[schemaField][attribute] !==
      editableSchema?.fields[schemaField][attribute]
    );
  };

  // table data so we memoize it for react-table
  const fields = useMemo(
    () =>
      editableSchema !== undefined
        ? Object.entries(editableSchema.fields).map(([name, field]) => ({ name, ...field }))
        : undefined,
    [editableSchema],
  );

  return { fields, changeSchemaDescription, wasSchemaUpdated };
};
