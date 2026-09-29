import { useEffect } from "react";

import { useRouter } from "next/router";

import { type ProductId } from "../routing/identifiers";
import { useAddressedProduct } from "./accessFacts";
import { AddressedResourceView, PendingResource } from "./resources";
import { subscriptionEntryDestination } from "./routes";

/**
 * The convenience entry for a caller holding only a product identifier.
 *
 * It reads the product, learns which unit owns it, and replaces itself with that subscription's
 * canonical unit-scoped address. It renders no content of its own, which is what stops it becoming
 * a second address for the subscription page — the same precedent a dataset addressed without a
 * version already sets.
 */
export const SubscriptionEntry = ({ productId }: { productId: ProductId }) => {
  const router = useRouter();
  const addressed = useAddressedProduct(productId);
  const unitId = addressed.kind === "available" ? addressed.resource.unit.id : undefined;

  useEffect(() => {
    if (unitId) {
      void router.replace(subscriptionEntryDestination(unitId, productId) as never);
    }
  }, [productId, router, unitId]);

  return (
    <AddressedResourceView
      addressed={addressed}
      identity={(subscription) => subscription.product.id}
      section="Subscription"
      subject="subscription"
    >
      {() => <PendingResource section="Subscription" />}
    </AddressedResourceView>
  );
};
