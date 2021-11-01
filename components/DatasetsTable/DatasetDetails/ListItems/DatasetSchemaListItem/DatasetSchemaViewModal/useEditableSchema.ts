import { useCallback, useEffect, useMemo } from 'react';

import { useImmerReducer } from 'use-immer';

import type { Field, FieldKey, Fields, FieldValue, TypedSchema } from './types';

type EditableSchemaStateAction<K extends FieldKey, V extends FieldValue<K>> =
  | { type: 'clear' }
  | { type: 'init'; originalSchema: TypedSchema }
  | { type: 'changeField'; fieldName: string; fieldKey: K; fieldValue: V }
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
  draft: EditableSchemaState,
  action: EditableSchemaStateAction<K, V>,
): EditableSchemaState | void => {
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
      if (draft) {
        const { fieldName, fieldKey, fieldValue } = action;

        // Has to be extracted like this because TS would complain of possibly undefined value.
        const editedField = draft.editedSchemaProps.fields[fieldName] || {};

        // If the provided field value equals to the original, unset the field key in the helper
        // object.
        if (draft.originalSchema.fields[fieldName][fieldKey] === fieldValue) {
          delete editedField[fieldKey];

          // If there are no keys remaining for the field, delete the whole field from the helper
          // object.
          if (!Object.keys(editedField).length) {
            delete draft.editedSchemaProps.fields[fieldName];
          } else {
            draft.editedSchemaProps.fields[fieldName] = editedField;
          }
        } else {
          editedField[fieldKey] = fieldValue;

          draft.editedSchemaProps.fields[fieldName] = editedField;
        }
      }
      break;
    }
    case 'changeDescription': {
      if (draft) {
        // Same explanation like the case above.
        if (draft.originalSchema.description === action.description) {
          delete draft.editedSchemaProps.description;
        } else {
          draft.editedSchemaProps.description = action.description;
        }
      }
      break;
    }
    default:
      break;
  }
};

/**
 * A hook which encapsulates logic used to edit dataset's schema. It stores the original copy as
 * well as a helper object which tracks changes to the schema. It provides the original schema as
 * well as the edited schema, which is composed from the helper object and the original schema.
 */
export const useEditableSchemaView = (originalSchema?: TypedSchema) => {
  const [editableSchemaState, dispatch] = useImmerReducer<EditableSchemaState>(
    editableSchemaReducer,
    null,
  );

  useEffect(() => {
    // If no original schema has been provided, return undefined state.
    if (originalSchema) {
      dispatch({ type: 'init', originalSchema });
    } else {
      dispatch({ type: 'clear' });
    }
  }, [originalSchema, dispatch]);

  // Calculates the current state of the schema. It loops through the original schema and looks for
  // changes to its fields in the helper object. If it finds changes, it uses those. If it doesn't,
  // it uses the original values.
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

  const setSchemaField = useCallback(
    <K extends FieldKey, V extends FieldValue<K>>(
      fieldName: string,
      fieldKey: K,
      fieldValue: V,
    ) => {
      dispatch({ type: 'changeField', fieldName, fieldKey, fieldValue });
    },
    [dispatch],
  );

  const setSchemaDescription = useCallback(
    (description: string) => {
      dispatch({ type: 'changeDescription', description });
    },
    [dispatch],
  );

  // Returns the changes in the form of the original schema. `Partial` is used because not every
  // field of the schema has to be changed.
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
    setSchemaField,
    setSchemaDescription,
    getDeltaChanges,
  };
};
