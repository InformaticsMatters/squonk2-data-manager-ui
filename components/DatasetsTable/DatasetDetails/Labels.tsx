import type { FC } from 'react';
import React from 'react';
import { useQueryClient } from 'react-query';

import type { DatasetVersionSummary } from '@squonk/data-manager-client';
import { getGetDatasetsQueryKey, useAddAnnotations } from '@squonk/data-manager-client/dataset';

import { Typography } from '@material-ui/core';

import { Chips } from '../../Chips';
import { LabelChip } from '../LabelChip';
import type { TableDataset } from '../types';
import { NewLabelButton } from './NewLabelButton';

export interface LabelsProps {
  datasetId: TableDataset['dataset_id'];
  datasetVersion: DatasetVersionSummary;
}

export const Labels: FC<LabelsProps> = ({ datasetId, datasetVersion }) => {
  const labels = Object.entries((datasetVersion.labels ?? {}) as Record<string, string>);

  const queryClient = useQueryClient();
  const { mutateAsync: addAnnotations } = useAddAnnotations();

  return (
    <Chips>
      {labels.length > 0 ? (
        labels.map(([label, value]) => (
          <LabelChip
            key={label}
            label={label}
            values={value}
            onDelete={async () => {
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
            }}
          />
        ))
      ) : (
        <Typography variant="body2">No labels exist for this version</Typography>
      )}
      <NewLabelButton datasetId={datasetId} datasetVersion={datasetVersion.version} />
    </Chips>
  );
};
