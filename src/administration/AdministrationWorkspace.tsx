import {
  type OrganisationAllDetail,
  type OrganisationUnitsGetResponse,
  type UnitAllDetail,
} from "@/api/account-server";
import { useGetOrganisationsSuspense } from "@/api/account-server/organisation";
import { useGetProductsSuspense } from "@/api/account-server/product";
import { useGetUnitsSuspense } from "@/api/account-server/unit";

import {
  Alert,
  Box,
  Card,
  CardActionArea,
  CardContent,
  Chip,
  Divider,
  Stack,
  Typography,
} from "@mui/material";

import { useFamilyRoute } from "../application/FamilyRouteBoundary";
import {
  isOrganisationId,
  isProductId,
  isUnitId,
  type OrganisationId,
  type ProductId,
  type UnitId,
} from "../routing/identifiers";
import { withBasePath } from "../utils/app/basePath";
import { AdministrationFrame } from "./AdministrationShell";
import { ChargeLedger } from "./ChargeLedgers";
import { administrationLinks, type AdministrationRoute } from "./routes";

type UnitWithOrganisation = { organisation: OrganisationAllDetail; unit: UnitAllDetail };
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
type AccessResourceRoute = Exclude<AdministrationResourceRoute, ProductResourceRoute>;

const taskTitles = {
  charges: "Charges",
  "organisation-access": "Organisation & access",
  subscriptions: "Subscriptions",
  "usage-inventory": "Usage & inventory",
} as const;

const EmptyTask = ({ children }: { children: string }) => (
  <Alert severity="info">
    {children} Contact an organisation owner or your Squonk administrator if you need access.
  </Alert>
);

const ResourceLink = ({
  ancestry,
  href,
  id,
  name,
  type,
}: {
  ancestry?: string;
  href: string;
  id: string;
  name: string;
  type: string;
}) => (
  <Card variant="outlined">
    <CardActionArea href={withBasePath(href)}>
      <CardContent>
        <Stack direction="row" spacing={1} sx={{ alignItems: "center", mb: 0.5 }}>
          <Typography component="h3" variant="h6">
            {name}
          </Typography>
          <Chip label={type} size="small" variant="outlined" />
        </Stack>
        {ancestry ? <Typography color="text.secondary">{ancestry}</Typography> : null}
        <Typography color="text.secondary" sx={{ overflowWrap: "anywhere" }} variant="caption">
          {id}
        </Typography>
      </CardContent>
    </CardActionArea>
  </Card>
);

const PageTitle = ({ children }: { children: string }) => (
  <Typography component="h2" sx={{ mb: 2 }} variant="h4">
    {children}
  </Typography>
);

const flattenUnits = (groups: OrganisationUnitsGetResponse[]): UnitWithOrganisation[] =>
  groups.flatMap(({ organisation, units }) => units.map((unit) => ({ organisation, unit })));

const organisationId = (value: string): OrganisationId => {
  if (!isOrganisationId(value)) {
    throw new Error("Account Server returned an invalid organisation ID");
  }
  return value;
};

const unitId = (value: string): UnitId => {
  if (!isUnitId(value)) {
    throw new Error("Account Server returned an invalid unit ID");
  }
  return value;
};

const productId = (value: string): ProductId => {
  if (!isProductId(value)) {
    throw new Error("Account Server returned an invalid product ID");
  }
  return value;
};

const useAccessIndex = () => {
  const { data: organisations } = useGetOrganisationsSuspense();
  const { data: unitGroups } = useGetUnitsSuspense();
  return { organisations: organisations.organisations, units: flattenUnits(unitGroups.units) };
};

const OrganisationAccessIndex = () => {
  const { organisations, units } = useAccessIndex();
  return (
    <>
      <PageTitle>Organisation & access</PageTitle>
      {organisations.length === 0 && units.length === 0 ? (
        <EmptyTask>
          No organisations or units are available. Membership of an organisation or unit is required
          to manage access.
        </EmptyTask>
      ) : (
        <Stack spacing={2}>
          {organisations.map((organisation) => (
            <ResourceLink
              href={administrationLinks.organisationAccessResource(
                "organisations",
                organisationId(organisation.id),
              )}
              id={organisation.id}
              key={organisation.id}
              name={organisation.name}
              type="Organisation"
            />
          ))}
          {units.map(({ organisation, unit }) => (
            <ResourceLink
              ancestry={organisation.name}
              href={administrationLinks.organisationAccessResource("units", unitId(unit.id))}
              id={unit.id}
              key={unit.id}
              name={unit.name}
              type="Unit"
            />
          ))}
        </Stack>
      )}
    </>
  );
};

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
              href={administrationLinks.subscription(productId(subscription.product.id))}
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
                organisationId(organisation.id),
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
              href={administrationLinks.chargeResource("units", unitId(unit.id))}
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
                productId(subscription.product.id),
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
                organisationId(organisation.id),
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
              href={administrationLinks.usageInventoryResource("units", unitId(unit.id))}
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

const ResourceDetailsView = ({
  ancestry,
  id,
  name,
  readOnly,
  task,
  type,
}: {
  ancestry?: string;
  id: string;
  name?: string;
  readOnly: boolean;
  task: string;
  type: string;
}) => {
  if (!name) {
    return (
      <Alert severity="warning">This resource is unavailable or you no longer have access.</Alert>
    );
  }

  return (
    <>
      <PageTitle>{task}</PageTitle>
      <Typography component="h3" variant="h5">
        {name}
      </Typography>
      {ancestry ? <Typography color="text.secondary">{ancestry}</Typography> : null}
      <Box sx={{ my: 2 }}>
        <Divider />
      </Box>
      <Typography sx={{ mb: 0.5 }}>{type} ID</Typography>
      <Typography component="code" sx={{ overflowWrap: "anywhere" }}>
        {id}
      </Typography>
      {!!readOnly && (
        <Alert severity="info" sx={{ mt: 2 }}>
          This view is read-only. Use Organisation & access or Project Manage for membership
          changes.
        </Alert>
      )}
    </>
  );
};

const AccessResourceDetails = ({ route }: { route: AccessResourceRoute }) => {
  const { organisations, units } = useAccessIndex();
  const task =
    route.kind === "charge-resource"
      ? "Charges"
      : route.kind === "usage-inventory-resource"
        ? "Usage & inventory"
        : "Organisation & access";

  if (route.collection === "organisations") {
    const organisation = organisations.find((candidate) => candidate.id === route.resourceId);
    return (
      <ResourceDetailsView
        id={route.resourceId}
        name={organisation?.name}
        readOnly={route.kind !== "organisation-access-resource"}
        task={task}
        type="Organisation"
      />
    );
  }

  const match = units.find(({ unit }) => unit.id === route.resourceId);
  return (
    <ResourceDetailsView
      ancestry={match?.organisation.name}
      id={route.resourceId}
      name={match?.unit.name}
      readOnly={route.kind !== "organisation-access-resource"}
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

const ResourceDetails = ({ route }: { route: AdministrationResourceRoute }) =>
  route.kind === "charge-resource" ? (
    <ChargeLedger route={route} />
  ) : route.kind === "subscription" ? (
    <ProductResourceDetails route={route} />
  ) : (
    <AccessResourceDetails route={route} />
  );

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
