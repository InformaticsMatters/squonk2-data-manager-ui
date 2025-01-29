import { type DatasetVersionSummary, type DmError } from "@squonk/data-manager-client";
import { getGetDatasetsQueryKey } from "@squonk/data-manager-client/dataset";
import { useAddMetadata } from "@squonk/data-manager-client/metadata";

import { Typography } from "@mui/material";
import { useQueryClient } from "@tanstack/react-query";

import { type TableDataset } from "../../features/DatasetsTable";
import { useEnqueueError } from "../../hooks/useEnqueueStackError";
import { LabelChip } from "./LabelChip";

export interface LabelsProps {
  /**
   * ID of the dataset
   */
  datasetId: TableDataset["dataset_id"];
  /**
   * version of the dataset
   */
  datasetVersion: DatasetVersionSummary;
}

/**
 *  Display formatted labels for a version of a dataset with options to add and remove labels.
 */
export const Labels = ({ datasetId, datasetVersion }: LabelsProps) => {
  const labels = Object.entries((datasetVersion.labels ?? {}) as Record<string, string>);

  const queryClient = useQueryClient();
  const { mutateAsync: addAnnotations } = useAddMetadata();

  const { enqueueError } = useEnqueueError<DmError>();

  if (labels.length === 0) {
    return (
      <Typography display="inline" variant="body2">
        No labels exist for this version
      </Typography>
    );
  }

  const deleteHandler = async (label: string, value: string) => {
    try {
      await addAnnotations({
        datasetId,
        data: {
          labels: JSON.stringify([{ label, value, type: "LabelAnnotation", active: false }]),
        },
      });
      void queryClient.invalidateQueries({ queryKey: getGetDatasetsQueryKey() });
    } catch (error) {
      enqueueError(error);
    }
  };

  return (
    <>
      {labels.map(([label, value]) => (
        <LabelChip
          key={label}
          label={label}
          sx={{ m: 0.5 }}
          values={value}
          onDelete={() => void deleteHandler(label, value)}
        />
      ))}
    </>
  );
};
