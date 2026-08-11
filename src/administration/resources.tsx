import { Fragment, type ReactNode } from "react";

import {
  Alert,
  Box,
  Card,
  CardActionArea,
  CardContent,
  Chip,
  Divider,
  Link,
  Stack,
  Typography,
} from "@mui/material";

import { type TransportFailure } from "../api/runtime/classifyTransportFailure";
import { CenterLoader } from "../components/CenterLoader";
import { withBasePath } from "../utils/app/basePath";
import { type AddressedResource } from "./accessFacts";
import { type AdministrationCapability } from "./capabilities";
import { presentAdministrationFailure } from "./failures";
import { administrationLinks, type OrganisationAccessCollection } from "./routes";

export const EmptyTask = ({ children }: { children: string }) => (
  <Alert severity="info">
    {children} Contact an organisation owner or your Squonk administrator if you need access.
  </Alert>
);

export const PageTitle = ({ children }: { children: string }) => (
  <Typography component="h2" sx={{ mb: 2 }} variant="h4">
    {children}
  </Typography>
);

export const ResourceLink = ({
  ancestry,
  headingLevel = "h3",
  href,
  id,
  name,
  type,
}: {
  ancestry?: string;
  /** Where this resource sits in the task's outline; deeper groupings pass a deeper level. */
  headingLevel?: "h3" | "h5";
  href: string;
  id: string;
  name: string;
  type: string;
}) => (
  <Card variant="outlined">
    <CardActionArea href={withBasePath(href)}>
      <CardContent>
        <Stack direction="row" spacing={1} sx={{ alignItems: "center", mb: 0.5 }}>
          <Typography component={headingLevel} variant="h6">
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

/**
 * An action and the capability that decides it. A hidden capability renders nothing at all; every
 * other one renders the control and, when it has something to explain, the reason beside it.
 */
export const CapabilityAction = ({
  capability,
  children,
}: {
  capability: AdministrationCapability;
  children: (state: { disabled: boolean }) => ReactNode;
}) => {
  if (capability.status === "hidden") {
    return null;
  }
  return (
    <Stack spacing={0.5} sx={{ alignItems: "flex-start" }}>
      {children({ disabled: capability.status === "disabled" })}
      {capability.reason ? (
        <Typography color="text.secondary" variant="body2">
          {capability.reason}
        </Typography>
      ) : null}
    </Stack>
  );
};

export const Section = ({ children, title }: { children: ReactNode; title: string }) => (
  <Box sx={{ mt: 3 }}>
    <Typography gutterBottom component="h4" variant="h6">
      {title}
    </Typography>
    {children}
  </Box>
);

export const ResourceChip = ({ label }: { label: string }) => (
  <Stack direction="row" spacing={1} sx={{ alignItems: "center", mb: 1 }}>
    <Chip label={label} size="small" variant="outlined" />
  </Stack>
);

/** How every Administration screen names the organisation and unit a resource belongs to. */
export const resourceAncestry = (organisationName: string, unitName: string) =>
  `${organisationName} / ${unitName}`;

export const MissingResource = ({ task }: { task: string }) => (
  <>
    <PageTitle>{task}</PageTitle>
    <Alert severity="warning">This resource is unavailable or you no longer have access.</Alert>
  </>
);

/** The addressed resource has not answered yet; the task and its canonical route already have. */
export const PendingResource = ({ task }: { task: string }) => (
  <>
    <PageTitle>{task}</PageTitle>
    <CenterLoader />
  </>
);

/**
 * The addressed resource answered authoritatively that it cannot be shown. The shared Administration
 * failure contract owns the wording, so a denial and an absence read the same way everywhere.
 */
export const UnavailableResource = ({
  failure,
  task,
}: {
  failure: TransportFailure;
  task: string;
}) => {
  const { message, severity } = presentAdministrationFailure(failure);
  return (
    <>
      <PageTitle>{task}</PageTitle>
      <Alert severity={severity}>{message}</Alert>
    </>
  );
};

export const ResourceIdentity = ({
  ancestry,
  id,
  name,
  type,
}: {
  ancestry?: string;
  id: string;
  name: string;
  type: string;
}) => (
  <>
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
  </>
);

/** Where a read-only report sends a caller who wants to change what it reports. */
export type MutationOwner = { href: string; label: string };

/**
 * Organisation and unit membership and privacy have one owner, so every report that names it says
 * the same thing and reaches it through the destination's route interface alone.
 */
export const organisationAccessOwner = <TCollection extends OrganisationAccessCollection>(
  collection: TCollection,
  resourceId: Parameters<typeof administrationLinks.organisationAccessResource<TCollection>>[1],
): MutationOwner => ({
  href: administrationLinks.organisationAccessResource(collection, resourceId),
  label: "Manage members and privacy in Organisation & access",
});

/**
 * A read-only report states that it cannot be changed and links the resource that can. The link is
 * built from the destination's route interface alone, so a report never reaches into the screens
 * that own the mutation. Where the caller could not carry the linked action out, the destination's
 * own reason is stated beside it rather than the link being withheld: the report is readable either
 * way, and only the owning task decides what may be done there.
 */
export const ReadOnlyNotice = ({
  children,
  owner,
  reason,
}: {
  children: string;
  owner: MutationOwner;
  reason?: string;
}) => (
  <Alert severity="info">
    {children} <Link href={withBasePath(owner.href)}>{owner.label}</Link>
    {reason ? ` ${reason}` : null}
  </Alert>
);

/**
 * Renders whatever the addressed resource itself answered. Keying the rendered resource by its
 * identity keeps what the screen holds owned by the resource in the address bar, so a route change
 * never carries one resource's entered values or chosen view into another's.
 */
export const AddressedResourceView = <TResource,>({
  addressed,
  children,
  identity,
  task,
}: {
  addressed: AddressedResource<TResource>;
  children: (resource: TResource) => ReactNode;
  /** The resource's own identity, which is what the rendered content is keyed by. */
  identity: (resource: TResource) => string;
  task: string;
}) => {
  if (addressed.kind === "pending") {
    return <PendingResource task={task} />;
  }
  if (addressed.kind === "unavailable") {
    return <UnavailableResource failure={addressed.failure} task={task} />;
  }
  return <Fragment key={identity(addressed.resource)}>{children(addressed.resource)}</Fragment>;
};

export const ResourceDetailsView = ({
  ancestry,
  id,
  name,
  task,
  type,
}: {
  ancestry?: string;
  id: string;
  name?: string;
  task: string;
  type: string;
}) => {
  if (!name) {
    return <MissingResource task={task} />;
  }

  return (
    <>
      <PageTitle>{task}</PageTitle>
      <ResourceIdentity ancestry={ancestry} id={id} name={name} type={type} />
    </>
  );
};
