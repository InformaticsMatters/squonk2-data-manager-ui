import type { DatasetSummary } from '@squonk/data-manager-client';

/**
 * Extended {@link TableDataset} with fileName and merged labels.
 */
export type TableDataset = DatasetSummary & {
  fileName: string;
  labels: Record<string, string | string[]>;
};
