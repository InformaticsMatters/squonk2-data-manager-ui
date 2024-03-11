import type {
  ProductCoinsDetail,
  ProductDmStorageDetail,
  ProductInstanceDetail,
} from "@squonk/account-server-client";

import { UsageChart } from "./UsageChart";

export interface ProjectUsageChartProps {
  coins: ProductCoinsDetail;
  instance: ProductInstanceDetail;
  storage: ProductDmStorageDetail;
}

/**
 * Displays bar chart with project subscription info.
 */
export const ProjectUsageChart = ({ coins, instance, storage }: ProjectUsageChartProps) => {
  const allowance = coins.allowance;
  const instancesUsed = instance.coins.used;
  const storagePredicted = coins.billing_prediction_storage_contribution;
  const storageUsed = storage.coins.used;

  const available = Math.max(allowance - (storageUsed + storagePredicted + instancesUsed), 0);

  const chartData = [
    { type: "Instances used", value: instancesUsed, color: "darkred" },
    { type: "Storage used", value: storageUsed, color: "red" },
    { type: "Storage predicted", value: storagePredicted, color: "orange" },
    { type: "Available", value: available, color: "green" },
  ];

  return <UsageChart chartData={chartData} unitCost={storage.coins.unit_cost} />;
};
