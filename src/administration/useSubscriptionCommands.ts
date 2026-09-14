import { type ProductPatchBodyBody } from "@/api/account-server";
import {
  getGetProductQueryKey,
  getGetProductsForOrganisationQueryKey,
  getGetProductsForUnitQueryKey,
  getGetProductsQueryKey,
  useCreateUnitProduct,
  useDeleteProduct,
  usePatchProduct,
} from "@/api/account-server/product";

import { type QueryClient, useQueryClient } from "@tanstack/react-query";

/** The unit a subscription is billed to, and the organisation above it when that is known. */
export type SubscriptionBillingOwner = { organisationId?: string; unitId: string };

/** An existing subscription, named by its own identity as well as by the owner it belongs to. */
export type AddressedSubscription = SubscriptionBillingOwner & { productId: string };

/**
 * The generated key factories are the sole cache identity for subscription data, and every command
 * refreshes the same prefixes: the caller's product index, the addressed product, the unit that
 * holds it, and the organisation above that unit. No screen keeps a private list of subscriptions,
 * so one command cannot leave another view naming a subscription that no longer exists.
 */
const refreshSubscriptions = async (
  queryClient: QueryClient,
  { organisationId, productId, unitId }: Partial<AddressedSubscription> & SubscriptionBillingOwner,
  /** A deleted subscription is dropped instead of refetched: it has no resource left to read. */
  outcome: "changed" | "deleted" = "changed",
) => {
  if (productId !== undefined) {
    const queryKey = getGetProductQueryKey(productId);
    outcome === "deleted"
      ? queryClient.removeQueries({ queryKey })
      : await queryClient.invalidateQueries({ queryKey });
  }
  await Promise.all(
    [
      getGetProductsQueryKey(),
      getGetProductsForUnitQueryKey(unitId),
      ...(organisationId === undefined
        ? []
        : [getGetProductsForOrganisationQueryKey(organisationId)]),
    ].map((queryKey) => queryClient.invalidateQueries({ queryKey })),
  );
};

export type DatasetStorageSubscriptionInput = { allowance: number; name: string };

export const useSubscriptionCommands = () => {
  const queryClient = useQueryClient();
  const createUnitProduct = useCreateUnitProduct();
  const patchProduct = usePatchProduct();
  const deleteProduct = useDeleteProduct();

  const run = async <TResult>(
    command: Promise<TResult>,
    owner: Partial<AddressedSubscription> & SubscriptionBillingOwner,
    outcome: "changed" | "deleted" = "changed",
  ) => {
    const result = await command;
    await refreshSubscriptions(queryClient, owner, outcome);
    return result;
  };

  return {
    /**
     * Project-tier subscriptions are created by Project creation, which claims them as it goes, so
     * the only subscription this task creates is the storage one nothing else owns.
     */
    createDatasetStorageSubscription: (
      owner: SubscriptionBillingOwner,
      { allowance, name }: DatasetStorageSubscriptionInput,
    ) =>
      run(
        createUnitProduct.mutateAsync({
          unitId: owner.unitId,
          data: {
            allowance,
            // The Account Server uses the allowance as the limit when none is given, which is the
            // same subscription this form has always created.
            limit: allowance,
            name,
            type: "DATA_MANAGER_STORAGE_SUBSCRIPTION",
          },
        }),
        owner,
      ),
    adjustSubscription: (owner: AddressedSubscription, data: ProductPatchBodyBody) =>
      run(patchProduct.mutateAsync({ productId: owner.productId, data }), owner),
    deleteSubscription: (owner: AddressedSubscription) =>
      run(deleteProduct.mutateAsync({ productId: owner.productId }), owner, "deleted"),
  };
};
