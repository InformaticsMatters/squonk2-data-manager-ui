import { UsageChart } from './UsageChart';

export interface StorageUsageChartProps {
  storageUsed: number;
  storagePredicted: number;
  allowance: number;
}

export const StorageUsageChart = ({
  storageUsed,
  storagePredicted,
  allowance,
}: StorageUsageChartProps) => {
  const available = Math.max(allowance - (storageUsed + storagePredicted), 0);

  const chartData = [
    { type: 'Storage used', value: storageUsed, color: 'red' },
    { type: 'Storage predicted', value: storagePredicted, color: 'orange' },
    { type: 'Available', value: available, color: 'green' },
  ];

  return <UsageChart chartData={chartData} />;
};
