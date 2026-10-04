import { Fragment, type ReactElement, type ReactNode, Suspense } from "react";

import {
  Alert,
  Box,
  Chip,
  Divider,
  Link as MuiLink,
  Skeleton,
  Stack,
  Typography,
} from "@mui/material";
import {
  hashKey,
  useQueryClient,
  useSuspenseQuery,
  type UseSuspenseQueryOptions,
} from "@tanstack/react-query";
import Link from "next/link";

import {
  classifyTransportFailure,
  type TransportFailure,
} from "../api/runtime/classifyTransportFailure";
import { ReadFailureBoundary } from "../components/ReadFailureBoundary";
import { IdentitySkeleton } from "../components/skeletons";
import { type AdministrationCapability } from "./capabilities";
import {
  administrationReadIsAuthoritative,
  type AdministrationReadSubject,
  decideAdministrationReadFailure,
  presentAdministrationFailure,
} from "./failures";

export const PageTitle = ({ children }: { children: string }) => (
  <Typography component="h2" sx={{ mb: 2 }} variant="h4">
    {children}
  </Typography>
);

/**
 * Every link Administration renders. It is the theme's link colour on a Next link — never a bare
 * anchor, which renders as the browser's default blue, and never `color: inherit`, which renders as
 * body text. Both make clickable text invisible until it is hovered.
 */
export const AdministrationLink = ({ children, href }: { children: ReactNode; href: string }) => (
  <MuiLink component={Link} href={href as never}>
    {children}
  </MuiLink>
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

export const ResourceChip = ({ icon, label }: { icon?: ReactElement; label: string }) => (
  <Stack direction="row" spacing={1} sx={{ alignItems: "center", mb: 1 }}>
    <Chip icon={icon} label={label} size="small" variant="outlined" />
  </Stack>
);

/** The addressed resource has not answered yet; the section and its canonical route already have. */
export const PendingResource = ({ section }: { section: string }) => (
  <>
    <PageTitle>{section}</PageTitle>
    <IdentitySkeleton />
  </>
);

/**
 * A section that has not answered, heading and all: the frame's stand-in for whatever suspends
 * without a skeleton of its own, and the organisation sections' while the masthead has none yet.
 */
export const SectionSkeleton = () => (
  <>
    <Typography component="div" sx={{ mb: 2 }} variant="h4">
      <Skeleton width={240} />
    </Typography>
    <IdentitySkeleton />
  </>
);

/**
 * The addressed resource answered authoritatively that it cannot be shown. The shared Administration
 * failure contract owns the wording, so a denial and an absence read the same way everywhere.
 */
const UnavailableResource = ({
  failure,
  section,
}: {
  failure: TransportFailure;
  section: string;
}) => {
  const { message, severity } = presentAdministrationFailure(failure);
  return (
    <>
      <PageTitle>{section}</PageTitle>
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

/** The generated suspense read of one addressed resource. */
type AddressedRead<TResource> = UseSuspenseQueryOptions<any, any, TResource>;

const ReadResource = <TResource,>({
  children,
  read,
}: {
  children: (resource: TResource) => ReactNode;
  read: AddressedRead<TResource>;
}) => children(useSuspenseQuery(read).data);

/**
 * Renders whatever the addressed resource itself answered, behind a skeleton until it has.
 *
 * An authoritative refusal costs the screen what the refused subject was carrying, and no more. A
 * refused unit or subscription replaces the page, because a resource the caller cannot read has no
 * content. A refused organisation only removes the sections that came out of it: `degraded` is what
 * the screen still shows, which is how the default organisation's refused detail read stops taking
 * away the page a caller has to reach to create their first unit.
 *
 * The read is a suspense read, so a refusal arrives thrown. It is caught here, unreported, only
 * when it is this read's own authoritative answer; anything else — a transport fact worth
 * retrying, or a failure from beneath — goes on to the frame's retry boundary. The boundary is
 * keyed by the read, so one resource's refusal never outlives a navigation to another.
 *
 * Keying the rendered resource by its identity keeps what the screen holds owned by the resource in
 * the address bar, so a route change never carries one resource's entered values into another's.
 */
export const AddressedResourceView = <TResource,>({
  children,
  degraded,
  identity,
  read,
  section,
  skeleton,
  subject,
}: {
  children: (resource: TResource) => ReactNode;
  /** What survives a refusal this subject degrades rather than replaces. */
  degraded?: (failure: TransportFailure) => ReactNode;
  /** The resource's own identity, which is what the rendered content is keyed by. */
  identity: (resource: TResource) => string;
  read: AddressedRead<TResource>;
  /** What the section is called, so a state that has no resource yet still has a heading. */
  section: string;
  /** Stands in for the content until the read answers; the section's identity block by default. */
  skeleton?: ReactNode;
  subject: AdministrationReadSubject;
}) => {
  const queryClient = useQueryClient();

  return (
    <ReadFailureBoundary
      fallback={(error) => {
        const failure = classifyTransportFailure(error);
        return degraded && decideAdministrationReadFailure(subject, failure) === "degrade" ? (
          degraded(failure)
        ) : (
          <UnavailableResource failure={failure} section={section} />
        );
      }}
      isReadFailure={(error) =>
        administrationReadIsAuthoritative(error) &&
        error === queryClient.getQueryState(read.queryKey)?.error
      }
      key={hashKey(read.queryKey)}
    >
      <Suspense fallback={skeleton ?? <PendingResource section={section} />}>
        <ReadResource read={read}>
          {(resource) => <Fragment key={identity(resource)}>{children(resource)}</Fragment>}
        </ReadResource>
      </Suspense>
    </ReadFailureBoundary>
  );
};
