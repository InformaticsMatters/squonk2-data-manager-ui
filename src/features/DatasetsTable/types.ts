import { type DatasetSummary, type DatasetVersionSummary } from "@/api/data-manager";

type TableDatasetBase = {
  // Table data
  fileName: string;
  numberOfProjects: number;
  labels: Record<string, string[] | string>;
  dataset_id: string;
  editors: string[];
  version?: number;
  subRows: TableDataset[];
  // Pointers
  datasetSummary: DatasetSummary;
};

export type TableDatasetRow = TableDatasetBase & {
  type: "row";
  datasetVersion?: DatasetVersionSummary;
};

export type TableDatasetSubRow = TableDatasetBase & {
  type: "subRow";
  datasetVersion: DatasetVersionSummary;
  version: number;
  owner?: string;
};

/**
 * An item shown in the datasets table. It can either be a row or a sub row - regular rows don't
 * have a version and non empty subRows array, whereas sub rows have a version and an empty subRows
 * array. Each row or sub row has a reference to the original Dataset Summary.
 */
export type TableDataset = TableDatasetRow | TableDatasetSubRow;
