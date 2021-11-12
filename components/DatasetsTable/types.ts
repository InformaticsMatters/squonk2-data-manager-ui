import type { DatasetSummary, DatasetVersionSummary } from '@squonk/data-manager-client';

/**
 * An item shown in the datasets table. It can either be a row or a sub row - regular rows don't
 * have a version and non empty subRows array, whereas sub rows have a version and an empty subRows
 * array. Each row or sub row has a reference to the original Dataset Summary.
 */
export type TableDataset = {
  type: 'row' | 'subRow';
  // Table data
  fileName: string;
  numberOfProjects: number;
  labels: Record<string, string | string[]>;
  dataset_id: string;
  editors: string[];
  owner: string;
  version?: number;
  subRows: TableDataset[];
  // Pointers
  datasetSummary: DatasetSummary;
  datasetVersion: DatasetVersionSummary;
};
