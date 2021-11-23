import type { ProductDmStorage } from '@squonk/account-server-client';

import { UsageChart } from './UsageChart';

export interface StorageUsageChartProps {
  /**
   * Information about storage subscription.
   */
  storageSubscription: ProductDmStorage;
}

/**
 * Displays bar chart with storage subscription info.
 */
export const StorageUsageChart = ({ storageSubscription }: StorageUsageChartProps) => {
  const allowance = storageSubscription.coins.allowance;
  const storagePredicted = storageSubscription.coins.billing_prediction;
  const storageUsed = storageSubscription.storage.coins.used;

  const available = Math.max(allowance - (storageUsed + storagePredicted), 0);

  const chartData = [
    { type: 'Storage used', value: storageUsed, color: 'red' },
    { type: 'Storage predicted', value: storagePredicted, color: 'orange' },
    { type: 'Available', value: available, color: 'green' },
  ];

  return (
    <UsageChart chartData={chartData} unitCost={storageSubscription.storage.coins.unit_cost} />
  );
};
