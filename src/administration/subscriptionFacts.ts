import {
  type OrganisationAllDetail,
  type ProductDetailType,
  type ProductDmProjectTier,
  type ProductDmStorage,
  type UnitAllDetail,
} from "@/api/account-server";

import { isProjectId, type ProjectId } from "../routing/identifiers";
import { formatTierString } from "../utils/app/products";

/** An Account Server product. Subscriptions is the user-facing name for exactly this resource. */
export type Subscription = ProductDmProjectTier | ProductDmStorage;

/**
 * What a subscription is for, decided by the generated product type alone. A type this client does
 * not recognise is `unrecognised` rather than assumed: a billing resource is always worth listing,
 * and offering the wrong lifecycle for it would be worse than offering none.
 */
export type SubscriptionKind = "dataset-storage" | "project-tier" | "unrecognised";

/**
 * Regenerating the client with a new product type fails to compile here rather than silently, and a
 * type only the running service knows about is answered for at runtime by the same lookup.
 */
const kindsByProductType: Record<ProductDetailType, SubscriptionKind | undefined> = {
  DATA_MANAGER_PROJECT_TIER_SUBSCRIPTION: "project-tier",
  DATA_MANAGER_STORAGE_SUBSCRIPTION: "dataset-storage",
};

export const subscriptionKind = (product: Subscription): SubscriptionKind =>
  kindsByProductType[product.product.type] ?? "unrecognised";

export const subscriptionKindLabel: Record<SubscriptionKind, string> = {
  "dataset-storage": "Dataset storage",
  "project-tier": "Project tier",
  unrecognised: "Subscription",
};

/** A subscription the Account Server never named still needs something to be called. */
export const UNNAMED_SUBSCRIPTION = "Subscription";

export type SubscriptionAncestor = { id: string; name: string };

/**
 * What a project-tier subscription is being used for. The Account Server describes a claim as a
 * service-specific identity, so only one this route family can address becomes a link; every other
 * claim stays readable as the identity the subscription itself reported.
 */
export type SubscriptionClaim = { name?: string; projectId?: ProjectId; serviceId: string };

export type SubscriptionFacts = {
  allowance: number;
  atLimit: boolean;
  billingDay: number;
  claim?: SubscriptionClaim;
  /** Whether this subscription is used by a service resource at all, claimed or not. */
  claimable: boolean;
  created: string;
  kind: SubscriptionKind;
  limit: number;
  name: string;
  organisation: SubscriptionAncestor;
  productId: string;
  storageSize: string;
  /** Absent when the generated product declares no flavour, rather than guessed from its type. */
  tier?: string;
  /** The generated product type, retained as technical detail beside the Product ID. */
  type: string;
  unit: SubscriptionAncestor;
  used: number;
};

const describeClaim = (product: Subscription): SubscriptionClaim | undefined => {
  const claim = "claim" in product ? product.claim : undefined;
  if (!claim) {
    return undefined;
  }
  return {
    name: claim.name,
    projectId: isProjectId(claim.id) ? claim.id : undefined,
    serviceId: claim.id,
  };
};

/**
 * Describes a subscription from its generated product resource alone. No fact here is read from a
 * product name, so an unnamed or oddly named subscription presents exactly like any other.
 */
export const describeSubscription = (product: Subscription): SubscriptionFacts => ({
  allowance: product.coins.allowance,
  atLimit: product.coins.at_limit,
  billingDay: product.coins.billing_day,
  claim: describeClaim(product),
  claimable: product.claimable,
  created: product.product.created,
  kind: subscriptionKind(product),
  limit: product.coins.limit,
  name: product.product.name ?? UNNAMED_SUBSCRIPTION,
  organisation: { id: product.organisation.id, name: product.organisation.name },
  productId: product.product.id,
  storageSize: product.storage.size.current,
  tier: product.product.flavour ? formatTierString(product.product.flavour) : undefined,
  type: product.product.type,
  unit: { id: product.unit.id, name: product.unit.name },
  used: product.coins.used,
});

/**
 * An owner as the generated resources describe it: what it is called, and the membership facts the
 * Account Server's product endpoints answer to. Both the caller's index and each product resource
 * declare them, which is why a group can offer a subscription action without a second read.
 */
export type SubscriptionOrganisationOwner = Pick<
  OrganisationAllDetail,
  "caller_is_member" | "id" | "name"
>;
export type SubscriptionUnitOwner = Pick<
  UnitAllDetail,
  "caller_is_member" | "id" | "name" | "owner_id"
>;

export type SubscriptionUnitGroup = {
  subscriptions: SubscriptionFacts[];
  unit: SubscriptionUnitOwner;
};

export type SubscriptionOrganisationGroup = {
  organisation: SubscriptionOrganisationOwner;
  units: SubscriptionUnitGroup[];
};

const byName = (left: { name: string }, right: { name: string }) =>
  left.name.localeCompare(right.name);

const bySubscription = (left: SubscriptionFacts, right: SubscriptionFacts) =>
  byName(left, right) || left.productId.localeCompare(right.productId);

/**
 * Groups every accessible subscription under the organisation and unit that owns it.
 *
 * The caller's own organisation and unit index decides which owners are listed, so a unit that can
 * hold a subscription is visible before it has one. Each subscription additionally contributes the
 * ancestry its own product resource declares, which is what keeps a subscription in a unit the
 * index does not list grouped under a real owner rather than dropped from the task.
 */
export const groupSubscriptionsByOwner = ({
  organisations,
  products,
  units,
}: {
  organisations: readonly SubscriptionOrganisationOwner[];
  products: readonly Subscription[];
  units: readonly { organisation: SubscriptionOrganisationOwner; unit: SubscriptionUnitOwner }[];
}): SubscriptionOrganisationGroup[] => {
  const groups = new Map<
    string,
    { organisation: SubscriptionOrganisationOwner; units: Map<string, SubscriptionUnitGroup> }
  >();
  const organisationGroup = (organisation: SubscriptionOrganisationOwner) => {
    const existing = groups.get(organisation.id);
    if (existing) {
      return existing;
    }
    const created = { organisation, units: new Map<string, SubscriptionUnitGroup>() };
    groups.set(organisation.id, created);
    return created;
  };
  const unitGroup = (organisation: SubscriptionOrganisationOwner, unit: SubscriptionUnitOwner) => {
    const owner = organisationGroup(organisation);
    const existing = owner.units.get(unit.id);
    if (existing) {
      return existing;
    }
    const created: SubscriptionUnitGroup = { subscriptions: [], unit };
    owner.units.set(unit.id, created);
    return created;
  };

  // The caller's own index is read first, so an owner it lists keeps the membership facts the
  // caller was given rather than any a product resource repeats.
  for (const organisation of organisations) {
    organisationGroup(organisation);
  }
  for (const { organisation, unit } of units) {
    unitGroup(organisation, unit);
  }
  for (const product of products) {
    unitGroup(product.organisation, product.unit).subscriptions.push(describeSubscription(product));
  }

  return [...groups.values()]
    .map(({ organisation, units: unitGroups }) => ({
      organisation,
      units: [...unitGroups.values()]
        .map((group) => ({ ...group, subscriptions: group.subscriptions.toSorted(bySubscription) }))
        .toSorted((left, right) => byName(left.unit, right.unit)),
    }))
    .toSorted((left, right) => byName(left.organisation, right.organisation));
};
