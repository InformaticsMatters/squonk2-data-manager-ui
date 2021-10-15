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

    if (fields) {
      const data = { type: 'FieldsDescriptorAnnotation', origin: 'data-manager-api', fields };
      promises.push(
        mutateAddAnnotations({
          datasetid: datasetId,
          datasetversion: version,
          data: { annotations: JSON.stringify(data) },
        }),
      );
    }

    await Promise.allSettled(promises);

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
