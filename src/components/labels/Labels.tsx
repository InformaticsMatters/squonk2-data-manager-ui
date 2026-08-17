import { type DatasetVersionSummary, type DmError } from "@/api/data-manager";

import { Typography } from "@mui/material";

import { type DatasetCapability } from "../../datasets/capabilities";
import { datasetMutationFailureMessage } from "../../datasets/mutations";
import { useDatasetCommands } from "../../datasets/useDatasetCommands";
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
  capability: DatasetCapability;
}

/**
 *  Display formatted labels for a version of a dataset with options to add and remove labels.
 */
export const Labels = ({ datasetId, datasetVersion, capability }: LabelsProps) => {
  const labels = Object.entries((datasetVersion.labels ?? {}) as Record<string, string[] | string>);
  const { removeLabel } = useDatasetCommands();

  const { enqueueError, enqueueSnackbar } = useEnqueueError<DmError>();

  if (labels.length === 0) {
    return (
      <Typography sx={{ display: "inline" }} variant="body2">
        No labels exist for this version
      </Typography>
    );
  }

  const deleteHandler = async (label: string, value: string[] | string) => {
    try {
      await removeLabel(datasetId, datasetVersion.version, label, value);
    } catch (error) {
      const message = datasetMutationFailureMessage(
        error,
        "change labels for",
        datasetId,
        datasetVersion.version,
      );
      message ? enqueueSnackbar(message, { variant: "error" }) : enqueueError(error);
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
          onDelete={
            capability.status === "enabled" ? () => void deleteHandler(label, value) : undefined
          }
        />
      ))}
    </>
  );
};
