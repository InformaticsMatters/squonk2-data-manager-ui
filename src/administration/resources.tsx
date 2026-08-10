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
export const AddressedResourceView = <TResource extends { id: string }>({
  addressed,
  children,
  task,
}: {
  addressed: AddressedResource<TResource>;
  children: (resource: TResource) => ReactNode;
  task: string;
}) => {
  if (addressed.kind === "pending") {
    return <PendingResource task={task} />;
  }
  if (addressed.kind === "unavailable") {
    return <UnavailableResource failure={addressed.failure} task={task} />;
  }
  return <Fragment key={addressed.resource.id}>{children(addressed.resource)}</Fragment>;
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
