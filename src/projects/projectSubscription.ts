import { type ProductDmProjectTier, type ProductDmStorage } from "@/api/account-server";

import { formatTierString } from "../utils/app/products";

export type ProjectSubscriptionFacts = {
  allowance: number;
  atLimit: boolean;
  billingDay: number;
  burnRate: number;
  /** Only a project-tier subscription accounts for instances; storage products never do. */
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
): ProjectSubscriptionFacts => ({
  allowance: product.coins.allowance,
  atLimit: product.coins.at_limit,
  billingDay: product.coins.billing_day,
  burnRate: product.coins.current_burn_rate,
  instanceCoinsUsed: "instance" in product ? product.instance.coins.used : undefined,
  limit: product.coins.limit,
  prediction: product.coins.billing_prediction,
  productId: product.product.id,
  remainingDays: product.coins.remaining_days,
  storageCoinsUsed: product.storage.coins.used,
  storageSize: product.storage.size.current,
  tier: product.product.flavour ? formatTierString(product.product.flavour) : undefined,
  type: product.product.type,
  used: product.coins.used,
});
