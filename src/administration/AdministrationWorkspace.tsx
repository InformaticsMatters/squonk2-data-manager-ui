import { useGetProductsSuspense } from "@/api/account-server/product";

import { Alert, Stack, Typography } from "@mui/material";

import { useFamilyRoute } from "../application/FamilyRouteResolution";
import { useAccessIndex } from "./accessFacts";
import { AdministrationFrame } from "./AdministrationShell";
import { ChargeLedger } from "./ChargeLedgers";
import { assertOrganisationId, assertProductId, assertUnitId } from "./identifiers";
import { OrganisationAccessIndex, OrganisationAccessResource } from "./OrganisationAccess";
import { EmptyTask, PageTitle, ResourceLink } from "./resources";
import { administrationLinks, type AdministrationRoute } from "./routes";
import { SubscriptionResource, SubscriptionsIndex } from "./Subscriptions";
import { UsageInventoryIndex, UsageInventoryResource } from "./UsageInventory";

type AdministrationResourceRoute = Exclude<
  AdministrationRoute,
  | { kind: "charges" }
  | { kind: "organisation-access" }
  | { kind: "subscriptions" }
  | { kind: "usage-inventory" }
>;
const taskTitles = {
  charges: "Charges",
  "organisation-access": "Organisation & access",
  subscriptions: "Subscriptions",
  "usage-inventory": "Usage & inventory",
} as const;

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

const ResourceDetails = ({ route }: { route: AdministrationResourceRoute }) => {
  if (route.kind === "organisation-access-resource") {
    return <OrganisationAccessResource route={route} />;
  }
  if (route.kind === "charge-resource") {
    return <ChargeLedger route={route} />;
  }
  if (route.kind === "subscription") {
    return <SubscriptionResource route={route} />;
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
