import { useGetProductsSuspense } from "@/api/account-server/product";

import { Alert, Stack, Typography } from "@mui/material";

import { useFamilyRoute } from "../application/FamilyRouteBoundary";
import { useAccessIndex } from "./accessFacts";
import { AdministrationFrame } from "./AdministrationShell";
import { ChargeLedger } from "./ChargeLedgers";
import { assertOrganisationId, assertProductId, assertUnitId } from "./identifiers";
import { OrganisationAccessIndex, OrganisationAccessResource } from "./OrganisationAccess";
import { EmptyTask, PageTitle, ResourceDetailsView, ResourceLink } from "./resources";
import { administrationLinks, type AdministrationRoute } from "./routes";

type AdministrationResourceRoute = Exclude<
  AdministrationRoute,
  | { kind: "charges" }
  | { kind: "organisation-access" }
  | { kind: "subscriptions" }
  | { kind: "usage-inventory" }
>;
type ProductResourceRoute = Extract<
  AdministrationResourceRoute,
  { collection: "products" } | { kind: "subscription" }
>;
type ReadOnlyResourceRoute = Exclude<
  AdministrationResourceRoute,
  ProductResourceRoute | { kind: "organisation-access-resource" }
>;

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

const UsageInventoryIndex = () => {
  const { organisations, units } = useAccessIndex();
  return (
    <>
      <PageTitle>Usage & inventory</PageTitle>
      <Typography color="text.secondary" sx={{ mb: 2 }}>
        Reports are read-only. Membership changes belong in Organisation & access and project roles
        belong in Project Manage.
      </Typography>
      {organisations.length === 0 && units.length === 0 ? (
        <EmptyTask>
          No usage or inventory reports are available. Organisation or unit membership is required
          to inspect a report.
        </EmptyTask>
      ) : (
        <Stack spacing={2}>
          {organisations.map((organisation) => (
            <ResourceLink
              href={administrationLinks.usageInventoryResource(
                "organisations",
                assertOrganisationId(organisation.id),
              )}
              id={organisation.id}
              key={organisation.id}
              name={organisation.name}
              type="Organisation report"
            />
          ))}
          {units.map(({ organisation, unit }) => (
            <ResourceLink
              ancestry={organisation.name}
              href={administrationLinks.usageInventoryResource("units", assertUnitId(unit.id))}
              id={unit.id}
              key={unit.id}
              name={unit.name}
              type="Unit report"
            />
          ))}
        </Stack>
      )}
    </>
  );
};

const ReadOnlyResourceDetails = ({ route }: { route: ReadOnlyResourceRoute }) => {
  const { organisations, units } = useAccessIndex();
  const task = route.kind === "charge-resource" ? "Charges" : "Usage & inventory";

  if (route.collection === "organisations") {
    const organisation = organisations.find((candidate) => candidate.id === route.resourceId);
    return (
      <ResourceDetailsView
        readOnly
        id={route.resourceId}
        name={organisation?.name}
        task={task}
        type="Organisation"
      />
    );
  }

  const match = units.find(({ unit }) => unit.id === route.resourceId);
  return (
    <ResourceDetailsView
      readOnly
      ancestry={match?.organisation.name}
      id={route.resourceId}
      name={match?.unit.name}
      task={task}
      type="Unit"
    />
  );
};

const ProductResourceDetails = ({ route }: { route: ProductResourceRoute }) => {
  const { data } = useGetProductsSuspense();
  const id = route.kind === "subscription" ? route.productId : route.resourceId;
  const subscription = data.products.find((candidate) => candidate.product.id === id);
  return (
    <ResourceDetailsView
      ancestry={
        subscription ? `${subscription.organisation.name} / ${subscription.unit.name}` : undefined
      }
      id={id}
      name={subscription ? (subscription.product.name ?? "Subscription") : undefined}
      readOnly={route.kind === "charge-resource"}
      task={route.kind === "subscription" ? "Subscriptions" : "Charges"}
      type="Subscription"
    />
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
    return <ProductResourceDetails route={route} />;
  }
  return <ReadOnlyResourceDetails route={route} />;
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
