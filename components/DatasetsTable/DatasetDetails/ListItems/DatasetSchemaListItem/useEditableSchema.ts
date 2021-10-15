import { useCallback, useEffect, useMemo, useReducer } from 'react';

import type { Field, FieldKey, Fields, FieldValue, TypedSchema } from './types';

type EditableSchemaStateAction<K extends FieldKey, V extends FieldValue<K>> =
  | { type: 'clear' }
  | { type: 'init'; originalSchema: TypedSchema }
  | { type: 'changeField'; field: string; fieldKey: K; value: V }
  | { type: 'changeDescription'; description: string };

type EditedSchemaProps = {
  description?: string;
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
        const editedSchemaProps = {
          ...state.editedSchemaProps,
          fields: { ...state.editedSchemaProps.fields },
        };

        const editedField = editedSchemaProps.fields[field] || {};

        if (state.originalSchema.fields[field][fieldKey] === value) {
          delete editedField[fieldKey];

          if (!Object.keys(editedField).length) {
            delete editedSchemaProps.fields[field];
          } else {
            editedSchemaProps.fields[field] = editedField;
          }
        } else {
          editedField[fieldKey] = value;

          editedSchemaProps.fields[field] = editedField;
        }

        return {
          ...state,
          editedSchemaProps,
        };
      }
      return state;
    }
    case 'changeDescription': {
      if (state) {
        const editedSchemaProps = {
          ...state.editedSchemaProps,
        };

        if (state.originalSchema.description === action.description) {
          delete editedSchemaProps.description;
        } else {
          editedSchemaProps.description = action.description;
        }

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

export const useEditableSchemaView = (originalSchema?: TypedSchema) => {
  const [editableSchemaState, dispatch] = useReducer(editableSchemaReducer, null);

  useEffect(() => {
    if (originalSchema) {
      dispatch({ type: 'init', originalSchema });
    } else {
      dispatch({ type: 'clear' });
    }
  }, [originalSchema]);

  const schema = useMemo<TypedSchema | undefined>(() => {
    if (editableSchemaState) {
      const { originalSchema, editedSchemaProps } = editableSchemaState;

      const fields: Fields = {};
      Object.entries(originalSchema.fields).forEach(([name, originalField]) => {
        const editedField = editedSchemaProps.fields[name];

        const field: Field = {
          description: editedField?.description ?? originalField.description,
          type: editedField?.type ?? originalField.type,
        };

        fields[name] = field;
      });

      return {
        ...originalSchema,
        description: editedSchemaProps.description ?? originalSchema.description,
        fields,
      };
    }
    return undefined;
  }, [editableSchemaState]);

  const wasSchemaEdited = useMemo(() => {
    if (editableSchemaState) {
      const {
        editedSchemaProps: { description, fields },
      } = editableSchemaState;

      return description !== undefined || Object.entries(fields).length;
    }
    return false;
  }, [editableSchemaState]);

  const changeSchemaField = useCallback(
    <K extends FieldKey, V extends FieldValue<K>>(field: string, fieldKey: K, value: V) => {
      dispatch({ type: 'changeField', field, fieldKey, value });
    },
    [],
  );

  const changeSchemaDescription = useCallback((description: string) => {
    dispatch({ type: 'changeDescription', description });
  }, []);

  const getDeltaChanges = () => {
    const delta: Partial<TypedSchema> = {};
    if (editableSchemaState) {
      const {
        editedSchemaProps: { description, fields },
        originalSchema,
      } = editableSchemaState;
      if (description !== undefined) {
        delta.description = description;
      }

      const fieldEntries = Object.entries(fields);
      if (fieldEntries.length) {
        const deltaFields: Fields = {};

        fieldEntries.forEach(([name, editedField]) => {
          const originalField = originalSchema.fields[name];

          const field: Field = {
            description: editedField?.description ?? originalField.description,
            type: editedField?.type ?? originalField.type,
          };

          deltaFields[name] = field;
        });

        delta.fields = deltaFields;
      }
    }
    return delta;
  };

  return {
    originalSchema,
    schema,
    wasSchemaEdited,
    changeSchemaField,
    changeSchemaDescription,
    getDeltaChanges,
  };
};
