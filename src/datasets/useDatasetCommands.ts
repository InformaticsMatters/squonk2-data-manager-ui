import { useRef } from "react";

import {
  getGetDatasetsQueryKey,
  getGetDatasetsQueryOptions,
  useAddEditorToDataset,
  useDeleteDataset,
  useRemoveEditorFromDataset,
} from "@/api/data-manager/dataset";
import { useAddMetadataVersion } from "@/api/data-manager/metadata";
import { getGetTaskQueryOptions } from "@/api/data-manager/task";

import { type QueryClient, useQueryClient } from "@tanstack/react-query";

import {
  DatasetDeletionError,
  datasetDeletionLifecycle,
  DatasetDeletionPollingError,
  nextVersionAfterDeletion,
} from "./mutations";

const deletionPollIntervalMs = 500;
const deletionPollLimit = 120;

const wait = (milliseconds: number) =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, milliseconds);
  });

const refreshDatasets = async (queryClient: QueryClient) => {
  await queryClient.invalidateQueries({ queryKey: getGetDatasetsQueryKey() });
  return queryClient.fetchQuery({
    ...getGetDatasetsQueryOptions(),
    staleTime: Number.POSITIVE_INFINITY,
  });
};

const waitForDeletion = async (queryClient: QueryClient, taskId: string) => {
  for (let attempt = 0; attempt < deletionPollLimit; attempt += 1) {
    const task = await queryClient.fetchQuery({ ...getGetTaskQueryOptions(taskId), staleTime: 0 });
    const lifecycle = datasetDeletionLifecycle(task);
    if (lifecycle.status === "succeeded") {
      return;
    }
    if (lifecycle.status === "failed") {
      throw new DatasetDeletionError(
        `Dataset deletion task failed${
          lifecycle.exitCode === undefined ? "" : ` with exit code ${lifecycle.exitCode}`
        }.`,
        taskId,
      );
    }
    await wait(deletionPollIntervalMs);
  }
  throw new DatasetDeletionPollingError(taskId);
};

export const useDatasetCommands = () => {
  const queryClient = useQueryClient();
  const addMetadata = useAddMetadataVersion();
  const addEditor = useAddEditorToDataset();
  const removeEditor = useRemoveEditorFromDataset();
  const deleteDataset = useDeleteDataset();
  const acceptedDeletionTasks = useRef(new Map<string, string>());

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
      const deletionKey = `${datasetId}/${datasetVersion}`;
      let taskId = acceptedDeletionTasks.current.get(deletionKey);
      if (!taskId) {
        const task = await deleteDataset.mutateAsync({ datasetId, datasetVersion });
        taskId = task.task_id;
        acceptedDeletionTasks.current.set(deletionKey, taskId);
      }
      try {
        await waitForDeletion(queryClient, taskId);
        acceptedDeletionTasks.current.delete(deletionKey);
        const datasets = await refreshDatasets(queryClient);
        const dataset = datasets.datasets.find(({ dataset_id }) => dataset_id === datasetId);
        return {
          nextVersion: nextVersionAfterDeletion(dataset?.versions ?? [], datasetVersion),
          taskId,
        };
      } catch (error) {
        if (error instanceof DatasetDeletionError) {
          acceptedDeletionTasks.current.delete(deletionKey);
        }
        throw error;
      }
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
