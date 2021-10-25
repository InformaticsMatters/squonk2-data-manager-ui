import type { DatasetSummary } from '@squonk/data-manager-client';

/**
 * Extended {@link TableDataset} with fileName, number of projects the dataset is used in and merged
 * labels.
 */
export type TableDataset = {
  fileName: string;
  numberOfProjects: number;
  labels: Record<string, string | string[]>;
  dataset_id: string;
  editors: string[];
  owner: string;
  version?: number;
  subRows: TableDataset[];
  datasetSummary: DatasetSummary;
};
