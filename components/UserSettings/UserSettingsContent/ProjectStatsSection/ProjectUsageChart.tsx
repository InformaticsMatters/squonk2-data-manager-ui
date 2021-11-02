import { UsageChart } from './UsageChart';

export interface ProjectUsageChartProps {
  instancesUsed: number;
  storageUsed: number;
  storagePredicted: number;
  allowance: number;
}

export const ProjectUsageChart = ({
  instancesUsed,
  storageUsed,
  storagePredicted,
  allowance,
}: ProjectUsageChartProps) => {
  const available = Math.max(allowance - (storageUsed + storagePredicted + instancesUsed), 0);

  const chartData = [
    { type: 'Instances used', value: instancesUsed, color: 'darkred' },
    { type: 'Storage used', value: storageUsed, color: 'red' },
    { type: 'Storage predicted', value: storagePredicted, color: 'orange' },
    { type: 'Available', value: available, color: 'green' },
  ];

  return <UsageChart chartData={chartData} />;
};
