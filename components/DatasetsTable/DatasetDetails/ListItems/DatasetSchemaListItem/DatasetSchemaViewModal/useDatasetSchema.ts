import type { DatasetAnnotationsPostResponse, Error as DMError } from '@squonk/data-manager-client';
import {
  useAddAnnotations,
  useGetSchema,
  useUpdateMetadata,
} from '@squonk/data-manager-client/dataset';

import type { AxiosError } from 'axios';

import type { TypedSchema } from './types';
import { useEditableSchemaView } from './useEditableSchema';

export const useDatasetSchema = (datasetId: string, version: number) => {
  // Cast the response to TypedSchema since OpenAPI is missing type definitions.
  const {
    data: schema,
    isLoading: isSchemaLoading,
    isError: isSchemaError,
    error: schemaError,
    refetch: refetchSchema,
  } = useGetSchema<TypedSchema, AxiosError<DMError>>(datasetId, version);
  const { getDeltaChanges, ...editableSchema } = useEditableSchemaView(schema);

  const {
    isLoading: isUpdateMetadataLoading,
    isError: isUpdateMetadataError,
    error: updateMetadataError,
    reset: resetUpdateMetadata,
    mutateAsync: mutateUpdateMetadata,
  } = useUpdateMetadata<void, AxiosError<DMError>>();

  const {
    isLoading: isAddAnnotationsLoading,
    isError: isAddAnnotationsError,
    error: addAnnotationsError,
    reset: resetAddAnnotations,
    mutateAsync: mutateAddAnnotations,
  } = useAddAnnotations<DatasetAnnotationsPostResponse, AxiosError<DMError>>();

  const isSaving = isUpdateMetadataLoading || isAddAnnotationsLoading;
  const isSavingError = isUpdateMetadataError || isAddAnnotationsError;
  // Since 2 endpoints can be called, create an array of arrays. `type` parameters are used as keys
  // for React components
  const savingErrors = (() => {
    const errors = [];

    if (updateMetadataError) {
      errors.push({ type: 'metadata', error: updateMetadataError });
    }

    if (addAnnotationsError) {
      errors.push({ type: 'annotations', error: addAnnotationsError });
    }
    return errors;
  })();

  const saveSchema = async () => {
    resetUpdateMetadata();
    resetAddAnnotations();

    const schemaChanges = getDeltaChanges();
    const { description, fields } = schemaChanges;

    const promises = [];

    // Only update description if it was changed.
    if (description !== undefined) {
      const data = { description };
      promises.push(
        mutateUpdateMetadata({
          datasetid: datasetId,
          datasetversion: version,
          metaparameters: JSON.stringify(data),
        }),
      );
    }

    // Only update field definitions if they were changed.
    if (fields) {
      // TODO needs more info on the API to work
      const data = { type: 'FieldsDescriptorAnnotation', origin: 'data-manager-api', fields };
      promises.push(
        mutateAddAnnotations({
          datasetid: datasetId,
          datasetversion: version,
          data: { annotations: JSON.stringify(data) },
        }),
      );
    }

    // Run both requests at the same time to avoid waterfall effect. If anyone of them fails,
    // it will be reported in the `saveErrors` variable.
    await Promise.allSettled(promises);

    // Once updated fetch a fresh copy of dataset's schema.
    refetchSchema();
  };

  return {
    editableSchema,
    isSchemaLoading,
    isSchemaError,
    schemaError,
    isSaving,
    isSavingError,
    savingErrors,
    saveSchema,
  };
};
