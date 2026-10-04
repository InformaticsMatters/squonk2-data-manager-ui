import { useEffect } from "react";

import { useRouter } from "next/router";

import { type ProductId } from "../routing/identifiers";
import { addressedProductRead } from "./accessFacts";
import { AddressedResourceView, PendingResource } from "./resources";
import { subscriptionEntryDestination } from "./routes";

/** Replaces the entry with the subscription's canonical address, once its unit is known. */
const CanonicalSubscription = ({ productId, unitId }: { productId: ProductId; unitId: string }) => {
  const router = useRouter();

  useEffect(() => {
    void router.replace(subscriptionEntryDestination(unitId, productId) as never);
  }, [productId, router, unitId]);

  return <PendingResource section="Subscription" />;
};

/**
 * The convenience entry for a caller holding only a product identifier.
 *
 * It reads the product, learns which unit owns it, and replaces itself with that subscription's
 * canonical unit-scoped address. It renders no content of its own, which is what stops it becoming
 * a second address for the subscription page — the same precedent a dataset addressed without a
 * version already sets.
 */
export const SubscriptionEntry = ({ productId }: { productId: ProductId }) => (
  <AddressedResourceView
    identity={(subscription) => subscription.product.id}
    read={addressedProductRead(productId)}
    section="Subscription"
    subject="subscription"
  >
    {(subscription) => (
      <CanonicalSubscription productId={productId} unitId={subscription.unit.id} />
    )}
  </AddressedResourceView>
);
