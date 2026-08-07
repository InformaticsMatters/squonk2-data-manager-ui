import { useCallback } from "react";

import { type DatasetPostBodyBody } from "@/api/data-manager";
import { getGetDatasetsQueryKey, uploadDataset } from "@/api/data-manager/dataset";

import { useQueryClient } from "@tanstack/react-query";
import { type AxiosProgressEvent } from "axios";

import { type DatasetUploadRecord, datasetUploadRequestFailure } from "./uploadLifecycle";

export type DatasetUploadInput = {
  /** Extra variables the file's own MIME type asked for, already shaped for the endpoint. */
  formatExtraVariables?: string;
  file: File;
  mimeType: string;
  name: string;
  unitId: string;
};

/**
 * The only owner of the dataset upload command and of the invalidation its success earns.
 *
 * Uploading is not a generated mutation hook because the endpoint's progress callback is not
 * available through one, so the command is issued directly here and its outcome is returned as a
 * record the shared classifier already understands. No screen holds a query client of its own.
 */
export const useDatasetUploadCommands = () => {
  const queryClient = useQueryClient();

  return {
    /**
     * Sends one file and answers with the record its request earned. Progress is reported as it
     * arrives so the caller can update that file, and only that file.
     */
    send: useCallback(
      async (
        input: DatasetUploadInput,
        onProgress: (progress: number) => void,
      ): Promise<DatasetUploadRecord> => {
        const data: DatasetPostBodyBody = {
          as_filename: input.name,
          dataset_file: input.file,
          dataset_type: input.mimeType,
          format_extra_variables: input.formatExtraVariables,
          skip_molecule_load: false,
          unit_id: input.unitId,
        };
        try {
          const response = await uploadDataset(data, {
            onUploadProgress: ({ loaded, total }: AxiosProgressEvent) => {
              if (total) {
                onProgress(Math.floor((loaded * 100) / total));
              }
            },
          });
          return { kind: "accepted", taskId: response.task_id };
        } catch (error) {
          return datasetUploadRequestFailure(error);
        }
      },
      [],
    ),

    /**
     * The dataset collection only changes once the Data Manager has finished processing one, so
     * this is the single place an upload refreshes it.
     */
    refreshDatasets: useCallback(
      () => queryClient.invalidateQueries({ queryKey: getGetDatasetsQueryKey() }),
      [queryClient],
    ),
  };
};
