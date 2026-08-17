import { useRef } from "react";

import {
  getGetDatasetsQueryKey,
  getGetDatasetsQueryOptions,
  useAddEditorToDataset,
  useDeleteDataset,
  useRemoveEditorFromDataset,
} from "@/api/data-manager/dataset";
import { useAddMetadataVersion } from "@/api/data-manager/metadata";

import { type QueryClient, useQueryClient } from "@tanstack/react-query";

import { type AcceptedDatasetTasks, settleDatasetTask } from "./awaitDatasetTask";
import { nextVersionAfterDeletion } from "./mutations";

const refreshDatasets = async (queryClient: QueryClient) => {
  await queryClient.invalidateQueries({ queryKey: getGetDatasetsQueryKey() });
  return queryClient.fetchQuery({
    ...getGetDatasetsQueryOptions(),
    staleTime: Number.POSITIVE_INFINITY,
  });
};

export const useDatasetCommands = () => {
  const queryClient = useQueryClient();
  const addMetadata = useAddMetadataVersion();
  const addEditor = useAddEditorToDataset();
  const removeEditor = useRemoveEditorFromDataset();
  const deleteDataset = useDeleteDataset();
  const acceptedDeletionTasks = useRef<AcceptedDatasetTasks>(new Map());

  const updateLabels = async (
    datasetId: string,
    datasetVersion: number,
    labels: readonly { active: boolean; label: string; value: string }[],
  ) => {
    await addMetadata.mutateAsync({
      datasetId,
      datasetVersion,
      data: {
        annotations: JSON.stringify(labels.map((label) => ({ ...label, type: "LabelAnnotation" }))),
      },
    });
    await refreshDatasets(queryClient);
  };

  return {
    addEditor: async (datasetId: string, userId: string) => {
      await addEditor.mutateAsync({ datasetId, userId });
      await refreshDatasets(queryClient);
    },
    addLabel: (datasetId: string, datasetVersion: number, label: string, value: string) =>
      updateLabels(datasetId, datasetVersion, [{ active: true, label, value }]),
    deleteVersion: async (datasetId: string, datasetVersion: number) => {
      const taskId = await settleDatasetTask({
        accepted: acceptedDeletionTasks.current,
        action: "Dataset deletion",
        identity: `${datasetId}/${datasetVersion}`,
        queryClient,
        send: async () => (await deleteDataset.mutateAsync({ datasetId, datasetVersion })).task_id,
      });
      const datasets = await refreshDatasets(queryClient);
      const dataset = datasets.datasets.find(({ dataset_id }) => dataset_id === datasetId);
      return {
        nextVersion: nextVersionAfterDeletion(dataset?.versions ?? [], datasetVersion),
        taskId,
      };
    },
    isLabelPending: addMetadata.isPending,
    removeEditor: async (datasetId: string, userId: string) => {
      await removeEditor.mutateAsync({ datasetId, userId });
      await refreshDatasets(queryClient);
    },
    removeLabel: (
      datasetId: string,
      datasetVersion: number,
      label: string,
      value: string | readonly string[],
    ) =>
      updateLabels(
        datasetId,
        datasetVersion,
        (Array.isArray(value) ? value : [value]).map((item) => ({
          active: false,
          label,
          value: item,
        })),
      ),
  };
};
