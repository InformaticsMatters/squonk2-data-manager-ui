import { useGetProductsSuspense } from "@/api/account-server/product";

import { Alert, Button, Stack, Typography } from "@mui/material";
import Link from "next/link";

import { useFamilyRoute } from "../application/FamilyRouteBoundary";
import { isUnclaimedProjectSubscription } from "../projects/projectCreation";
import { projectLinks } from "../projects/routes";
import { useAccessIndex } from "./accessFacts";
import { AdministrationFrame } from "./AdministrationShell";
import { ChargeLedger } from "./ChargeLedgers";
import { assertOrganisationId, assertProductId, assertUnitId } from "./identifiers";
import { OrganisationAccessIndex, OrganisationAccessResource } from "./OrganisationAccess";
import { EmptyTask, PageTitle, ResourceDetailsView, ResourceLink } from "./resources";
import { administrationLinks, type AdministrationRoute } from "./routes";
import { UsageInventoryIndex, UsageInventoryResource } from "./UsageInventory";

type AdministrationResourceRoute = Exclude<
  AdministrationRoute,
  | { kind: "charges" }
  | { kind: "organisation-access" }
  | { kind: "subscriptions" }
  | { kind: "usage-inventory" }
>;
type SubscriptionDetailRoute = Extract<AdministrationResourceRoute, { kind: "subscription" }>;

const taskTitles = {
  charges: "Charges",
  "organisation-access": "Organisation & access",
  subscriptions: "Subscriptions",
  "usage-inventory": "Usage & inventory",
} as const;

const SubscriptionsIndex = () => {
  const { data } = useGetProductsSuspense();
  return (
    <>
      <PageTitle>Subscriptions</PageTitle>
      {data.products.length === 0 ? (
        <EmptyTask>
          No subscriptions are available. Membership and an appropriate subscription capability are
          required to create or manage one.
        </EmptyTask>
      ) : (
        <Stack spacing={2}>
          {data.products.map((subscription) => (
            <ResourceLink
              ancestry={`${subscription.organisation.name} / ${subscription.unit.name}`}
              href={administrationLinks.subscription(assertProductId(subscription.product.id))}
              id={subscription.product.id}
              key={subscription.product.id}
              name={subscription.product.name ?? "Subscription"}
              type="Subscription"
            />
          ))}
        </Stack>
      )}
    </>
  );
};

const ChargesIndex = () => {
  const { organisations, units } = useAccessIndex();
  const { data: products } = useGetProductsSuspense();

  return (
    <>
      <PageTitle>Charges</PageTitle>
      <Typography color="text.secondary" sx={{ mb: 2 }}>
        Charge ledgers are read-only. Select an organisation, unit, or subscription explicitly.
      </Typography>
      {organisations.length === 0 && units.length === 0 && products.products.length === 0 ? (
        <EmptyTask>
          No charge ledgers are available. A finance relationship with an organisation, unit, or
          subscription is required.
        </EmptyTask>
      ) : (
        <Stack spacing={2}>
          {organisations.map((organisation) => (
            <ResourceLink
              href={administrationLinks.chargeResource(
                "organisations",
                assertOrganisationId(organisation.id),
              )}
              id={organisation.id}
              key={organisation.id}
              name={organisation.name}
              type="Organisation ledger"
            />
          ))}
          {units.map(({ organisation, unit }) => (
            <ResourceLink
              ancestry={organisation.name}
              href={administrationLinks.chargeResource("units", assertUnitId(unit.id))}
              id={unit.id}
              key={unit.id}
              name={unit.name}
              type="Unit ledger"
            />
          ))}
          {products.products.map((subscription) => (
            <ResourceLink
              ancestry={`${subscription.organisation.name} / ${subscription.unit.name}`}
              href={administrationLinks.chargeResource(
                "products",
                assertProductId(subscription.product.id),
              )}
              id={subscription.product.id}
              key={subscription.product.id}
              name={subscription.product.name ?? "Subscription"}
              type="Subscription ledger"
            />
          ))}
        </Stack>
      )}
    </>
  );
};

/** A product's charge ledger is answered by Charges, so only Subscriptions reaches this view. */
const SubscriptionDetails = ({ route }: { route: SubscriptionDetailRoute }) => {
  const { data } = useGetProductsSuspense();
  const subscription = data.products.find((candidate) => candidate.product.id === route.productId);
  const canCreateProject = subscription && isUnclaimedProjectSubscription(subscription);
  return (
    <Stack spacing={2}>
      <ResourceDetailsView
        ancestry={
          subscription ? `${subscription.organisation.name} / ${subscription.unit.name}` : undefined
        }
        id={route.productId}
        name={subscription ? (subscription.product.name ?? "Subscription") : undefined}
        task="Subscriptions"
        type="Subscription"
      />
      {canCreateProject ? (
        <Button
          component={Link}
          href={projectLinks.create({ subscriptionId: route.productId })}
          sx={{ alignSelf: "flex-start" }}
          variant="contained"
        >
          Create linked project
        </Button>
      ) : null}
    </Stack>
  );
};

const ResourceDetails = ({ route }: { route: AdministrationResourceRoute }) => {
  if (route.kind === "organisation-access-resource") {
    return <OrganisationAccessResource route={route} />;
  }
  if (route.kind === "charge-resource") {
    return <ChargeLedger route={route} />;
  }
  if (route.kind === "subscription") {
    return <SubscriptionDetails route={route} />;
  }
  return <UsageInventoryResource route={route} />;
};

const AdministrationContent = () => {
  const context = useFamilyRoute();
  if (context.policy.kind !== "administration") {
    throw new Error("Administration workspace requires an Administration route");
  }
  if (context.localNotFound) {
    return (
      <>
        <PageTitle>{taskTitles[context.policy.section]}</PageTitle>
        <Alert severity="warning">The requested Administration resource was not found.</Alert>
      </>
    );
  }

  const route = context.route as AdministrationRoute;
  switch (route.kind) {
    case "organisation-access":
      return <OrganisationAccessIndex />;
    case "subscriptions":
      return <SubscriptionsIndex />;
    case "charges":
      return <ChargesIndex />;
    case "usage-inventory":
      return <UsageInventoryIndex />;
    default:
      return <ResourceDetails route={route} />;
  }
};

export const AdministrationWorkspace = () => (
  <AdministrationFrame>
    <AdministrationContent />
  </AdministrationFrame>
);
