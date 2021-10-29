export type Flavour = 'EVALUATION' | 'BRONZE' | 'SILVER' | 'GOLD';

export type Subscription = {
  coins: {
    allowance: number;
    billing_prediction: number;
    cost_multiplier: number;
    current_burn_rate: number;
    next_cost_multiplier: number;
    remaining_days: number;
    used: number;
  };
  name: string;
  organisation: {
    id: string;
    name: string;
  };
  storage: {
    coins: {
      used: number;
    };
    size: {
      used: string;
    };
  };
  type: string;
  unit: {
    id: string;
    name: string;
  };
};

export type StorageSubscription = Subscription & {
  type: 'DATA_MANAGER_STORAGE_SUBSCRIPTION';
};

export type ProjectSubscription = Subscription & {
  type: 'DATA_MANAGER_PROJECT_TIER_SUBSCRIPTION';
  instance: {
    coins: {
      used: number;
    };
  };
  flavour: Flavour;
  project_claim_id: string;
};

export type GetProductResponse = {
  products: (StorageSubscription | ProjectSubscription)[];
};
