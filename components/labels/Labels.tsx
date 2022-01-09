import { useQueryClient } from 'react-query';

import type { DatasetVersionSummary, DmError } from '@squonk/data-manager-client';
import { getGetDatasetsQueryKey, useAddAnnotations } from '@squonk/data-manager-client/dataset';

import { Typography } from '@material-ui/core';

import { useEnqueueError } from '../../hooks/useEnqueueStackError';
import { Chips } from '../Chips';
import type { TableDataset } from '../DatasetsTable';
import { LabelChip } from './LabelChip';

export interface LabelsProps {
  /**
   * ID of the dataset
   */
  datasetId: TableDataset['dataset_id'];
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
  const { mutateAsync: addAnnotations } = useAddAnnotations();

  const { enqueueError } = useEnqueueError<DmError>();

  if (labels.length === 0) {
    return (
      <Typography display="inline" variant="body2">
        No labels exist for this version
      </Typography>
    );
  }

  return (
    <Chips>
      <>
        {labels.map(([label, value]) => (
          <LabelChip
            key={label}
            label={label}
            values={value}
            onDelete={async () => {
              try {
                await addAnnotations({
                  datasetid: datasetId,
                  datasetversion: datasetVersion.version,
                  data: {
                    annotations: JSON.stringify([
                      {
                        label,
                        value,
                        type: 'LabelAnnotation',
                        active: false,
                      },
                    ]),
                  },
                });
                queryClient.invalidateQueries(getGetDatasetsQueryKey());
              } catch (error) {
                enqueueError(error);
              }
            }}
          />
        ))}
      </>
    </Chips>
  );
};
