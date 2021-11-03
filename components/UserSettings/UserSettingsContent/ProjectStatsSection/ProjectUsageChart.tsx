import type { ProductDmProjectTier } from '@squonk/account-server-client';

import { UsageChart } from './UsageChart';

export interface ProjectUsageChartProps {
  /**
   * Information about project subscription.
   */
  projectSubscription: ProductDmProjectTier;
}

/**
 * Displays bar chart with project subscription info.
 */
export const ProjectUsageChart = ({ projectSubscription }: ProjectUsageChartProps) => {
  const allowance = projectSubscription.coins.allowance;
  const instancesUsed = projectSubscription.instance.coins.used;
  const storagePredicted = projectSubscription.coins.billing_prediction;
  const storageUsed = projectSubscription.storage.coins.used;

  const available = Math.max(allowance - (storageUsed + storagePredicted + instancesUsed), 0);

  const chartData = [
    { type: 'Instances used', value: instancesUsed, color: 'darkred' },
    { type: 'Storage used', value: storageUsed, color: 'red' },
    { type: 'Storage predicted', value: storagePredicted, color: 'orange' },
    { type: 'Available', value: available, color: 'green' },
  ];

  return <UsageChart chartData={chartData} />;
};
