export type UsageChartData = {
  type: string;
  value: number;
  color: string;
};

export type StorageSubscription = {
  coins: {
    allowance: number;
    billing_day: number;
    billing_prediction: number;
    cost_multiplier: number;
    current_burn_rate: number;
    limit?: number;
    next_cost_multiplier?: number;
    remaining_days: number;
    user: number;
  };
  organisation: {
    id: string;
    name: string;
  };
  product: {
    flavour?: string;
    id: string;
    name?: string;
    type: "DATA_MANAGER_STORAGE_SUBSCRIPTION";
  };
  storage: {
    coins: {
      unit_cost: number;
      used: number;
    };
    size: {
      current: string;
      peak: string;
      unit_size: string;
      units_used: string;
    };
  };
  unit: {
    id: string;
    name: string;
  };
};

export type ProjectSubscription = {
  claim?: {
    id: string;
    name?: string;
  };
  coins: {
    allowance: number;
    billing_day: number;
    billing_prediction: number;
    cost_multiplier: number;
    current_burn_rate: number;
    limit?: number;
    next_cost_multiplier?: number;
    remaining_days: number;
    user: number;
  };
  instance: {
    coins: { used: number };
  };
  organisation: {
    id: string;
    name: string;
  };
  product: {
    flavour: string;
    id: string;
    name?: string;
    type: "DATA_MANAGER_PROJECT_TIER_SUBSCRIPTION";
  };
  storage: {
    coins: {
      unit_cost: number;
      used: number;
    };
    size: {
      current: string;
      peak: string;
      unit_size: string;
      units_used: string;
    };
  };
  unit: {
    id: string;
    name: string;
  };
};

export type ProductsResponse = {
  products: (StorageSubscription | ProjectSubscription)[];
};
