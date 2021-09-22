import type { DatasetSummary } from '@squonk/data-manager-client';

interface BaseTableRow {
  fileName: string;
}

// Properties of datasets only
export type TableDataset = DatasetSummary &
  BaseTableRow & {
    labels: Record<string, string | string[]>;
  };
