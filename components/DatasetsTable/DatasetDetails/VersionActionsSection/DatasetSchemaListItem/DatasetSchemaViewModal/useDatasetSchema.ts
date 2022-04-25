import { useState } from 'react';
import { useQueryClient } from 'react-query';

import { getGetSchemaQueryKey, useGetSchema } from '@squonk/data-manager-client/dataset';
import { useAddMetadata, useAddMetadataVersion } from '@squonk/data-manager-client/metadata';

import type { TypedSchema } from './types';
import { useEditableSchemaView } from './useEditableSchema';

export const useDatasetSchema = (datasetId: string, version: number) => {
  const queryClient = useQueryClient();

  // Cast the response to TypedSchema since OpenAPI is missing type definitions.
  const {
    data: schema,
    isLoading: isSchemaLoading,
    isError: isSchemaError,
    error: schemaError,
  } = useGetSchema<TypedSchema>(datasetId, version);
  const { getDeltaChanges, ...editableSchema } = useEditableSchemaView(schema);

  const {
    isError: isUpdateMetadataError,
    error: updateMetadataError,
    reset: resetUpdateMetadata,
    // mutateAsync: updateMetadata,
  } = useAddMetadata();

  const {
    isError: isAddAnnotationsError,
    error: addAnnotationsError,
    reset: resetAddAnnotations,
    mutateAsync: addAnnotations,
  } = useAddMetadataVersion();

  const [isSaving, setIsSaving] = useState(false);

  const isSavingError = isUpdateMetadataError || isAddAnnotationsError;

  // Since 2 endpoints can be called, create an array of arrays. `type` parameters are used as keys
  // for React components
  const savingErrors = [];
  if (updateMetadataError) {
    savingErrors.push({ type: 'metadata', error: updateMetadataError });
  }
  if (addAnnotationsError) {
    savingErrors.push({ type: 'annotations', error: addAnnotationsError });
  }

  const saveSchema = async () => {
    resetUpdateMetadata();
    resetAddAnnotations();

    const schemaChanges = getDeltaChanges();
    const { description, fields } = schemaChanges;

    const promises = [];

    // Only update description if it was changed.
    if (description !== undefined) {
      // const data = { description };
      // promises.push(
      //   updateMetadata({
      //     datasetid: datasetId,
      //     datasetversion: version,
      //     metaparameters: JSON.stringify(data),
      //   }),
      // );
    }

    // Only update field definitions if they were changed.
    if (fields) {
      const data = { type: 'FieldsDescriptorAnnotation', origin: 'data-manager-api', fields };
      promises.push(
        addAnnotations({
          datasetId,
          datasetVersion: version,
          data: { annotations: JSON.stringify(data) },
        }),
      );
    }

    // Only execute if there are some changes to be made
    if (promises.length) {
      setIsSaving(true);

      // Run both requests at the same time to avoid waterfall effect. If any one of them fails,
      // it will be reported in the `saveErrors` variable.
      await Promise.allSettled(promises);

      // Once updated invalidate fetched schema data
      await queryClient.invalidateQueries(getGetSchemaQueryKey(datasetId, version));

      setIsSaving(false);
    }
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
