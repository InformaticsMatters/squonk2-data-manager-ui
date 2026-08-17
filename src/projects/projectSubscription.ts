import { type ProductDmProjectTier, type ProductDmStorage } from "@/api/account-server";

import { formatTierString } from "../utils/app/products";
import { type ProjectSubscriptionState } from "./capabilities";

/** The evaluators read the subscription state; every other fact here is presented, not judged. */
export type ProjectSubscriptionFacts = ProjectSubscriptionState & {
  allowance: number;
  billingDay: number;
  burnRate: number;
  /** Absent for a subscription that accounts for no instances; storage products never do. */
  instanceCoinsUsed: number | undefined;
  limit: number;
  prediction: number;
  productId: string;
  remainingDays: number;
  storageCoinsUsed: number;
  storageSize: string;
  /** Absent when the generated product declares no flavour, rather than guessed from its type. */
  tier: string | undefined;
  type: string;
  used: number;
};

/**
 * Describes the project's linked subscription from the generated product resource alone. The
 * project-tier and storage shapes are told apart by the fields the generated types declare, so no
 * presentation depends on a product name or an assumed type string.
 */
export const describeProjectSubscription = (
  product: ProductDmProjectTier | ProductDmStorage,
): ProjectSubscriptionFacts => {
  const instance = "instance" in product ? product.instance : undefined;

  return {
    accountsForInstances: instance !== undefined,
    allowance: product.coins.allowance,
    atLimit: product.coins.at_limit,
    billingDay: product.coins.billing_day,
    burnRate: product.coins.current_burn_rate,
    instanceCoinsUsed: instance?.coins.used,
    limit: product.coins.limit,
    prediction: product.coins.billing_prediction,
    productId: product.product.id,
    remainingDays: product.coins.remaining_days,
    storageCoinsUsed: product.storage.coins.used,
    storageSize: product.storage.size.current,
    tier: product.product.flavour ? formatTierString(product.product.flavour) : undefined,
    type: product.product.type,
    used: product.coins.used,
  };
};
