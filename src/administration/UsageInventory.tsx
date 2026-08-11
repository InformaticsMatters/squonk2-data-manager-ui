import { type ReactNode, useState } from "react";

import { type OrganisationAllDetail, type UnitAllDetail } from "@/api/account-server";
import { type InventoryProjectDetail } from "@/api/data-manager";

import { Close as CloseIcon, Done as DoneIcon } from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  Chip,
  Link as MuiLink,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import { type ColumnDef, type ColumnHelper, createColumnHelper } from "@tanstack/react-table";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import Link from "next/link";

import { CenterLoader } from "../components/CenterLoader";
import { Chips } from "../components/Chips";
import { DataTable } from "../components/DataTable";
import { DATE_FORMAT, TIME_FORMAT } from "../constants/datetimes";
import { projectLinks } from "../projects/routes";
import { isProjectId } from "../routing/identifiers";
import { withBasePath } from "../utils/app/basePath";
import {
  useAccessFacts,
  useAccessIndex,
  useAddressedOrganisation,
  useAddressedUnit,
  useUnitAncestry,
} from "./accessFacts";
import {
  capabilityReason,
  evaluateOrganisationMembershipCapability,
  evaluateUnitMembershipCapability,
  isDefaultOrganisationResource,
  isPersonalUnitResource,
} from "./capabilities";
import { presentAdministrationFailure } from "./failures";
import { assertOrganisationId, assertUnitId } from "./identifiers";
import {
  type InventoryProjectRow,
  type InventoryRead,
  type InventoryUserFacts,
  type OrganisationInventoryRow,
  type UnitInventoryRow,
} from "./inventoryFacts";
import {
  AddressedResourceView,
  EmptyTask,
  type MutationOwner,
  organisationAccessOwner,
  PageTitle,
  ReadOnlyNotice,
  ResourceIdentity,
  ResourceLink,
} from "./resources";
import { administrationLinks, type AdministrationRoute } from "./routes";
import { useOrganisationInventory, useUnitInventory } from "./useUsageInventory";

dayjs.extend(utc);

export type UsageInventoryResourceRoute = Extract<
  AdministrationRoute,
  { kind: "usage-inventory-resource" }
>;

const task = "Usage & inventory";

/**
 * Where a project role reported here is actually changed. An identifier the route family would
 * reject has no Manage route, which leaves the project readable in its row rather than taking the
 * whole report down with it.
 */
const projectManageHref = (projectId: string): string | undefined =>
  isProjectId(projectId) ? projectLinks.manage(projectId) : undefined;

/**
 * The activity facts the Data Manager reports about a user, which read the same whichever resource
 * the report is about.
 */
const activityColumns = <TRow extends InventoryUserFacts>(columnHelper: ColumnHelper<TRow>) => {
  // @tanstack/react-table does not narrow a column helper through a generic row type, so the shared
  // facts are described once against the facts themselves and handed back as this row's columns.
  const facts = columnHelper as unknown as ColumnHelper<InventoryUserFacts>;
  const columns = [
    facts.group({
      header: "Activity",
      columns: [
        facts.accessor("firstSeen", {
          header: "First Seen",
          cell: ({ getValue, row }) =>
            `${dayjs.utc(getValue()).format(`${DATE_FORMAT} ${TIME_FORMAT}`)} (${
              row.original.activity.total_days_since_first_seen
            } days ago)`,
          sortingFn: (a, b) =>
            dayjs.utc(a.original.firstSeen).diff(dayjs.utc(b.original.firstSeen)),
        }),
      ],
    }),
    facts.accessor("activity.total_days_active", {
      header: "Total",
      cell: ({ getValue }) => `${getValue()} days`,
    }),
    facts.accessor((row) => row.activity.period_b?.active_days, {
      id: "activity_b",
      header: "API Used",
      cell: ({ row }) =>
        row.original.activity.period_b
          ? `${row.original.activity.period_b.active_days} of last ${row.original.activity.period_b.monitoring_period}`
          : "",
    }),
    facts.accessor((row) => row.activity.period_a.active_days, {
      id: "activity_a",
      header: "",
      cell: ({ row }) =>
        `${row.original.activity.period_a.active_days} of last ${row.original.activity.period_a.monitoring_period}`,
    }),
    facts.accessor("lastSeen", {
      header: "Last Seen",
      cell: ({ getValue }) => dayjs.utc(getValue()).format(DATE_FORMAT),
      sortingFn: (a, b) => dayjs.utc(a.original.lastSeen).diff(dayjs.utc(b.original.lastSeen)),
    }),
  ];

  return columns as unknown as ColumnDef<TRow>[];
};

/** The projects one user holds a role in, each linking the route that owns that role. */
const ProjectChips = ({ projects }: { projects: InventoryProjectDetail[] }) => (
  <Chips>
    {projects.map((project) => {
      const href = projectManageHref(project.id);
      return href ? (
        <Chip
          clickable
          component={Link}
          href={href as never}
          key={project.id}
          label={project.name}
          size="small"
          variant="outlined"
        />
      ) : (
        <Chip key={project.id} label={project.name} size="small" variant="outlined" />
      );
    })}
  </Chips>
);

const UserChips = ({ users }: { users: string[] }) => (
  <Chips>
    {users.map((user) => (
      <Chip key={user} label={user} size="small" />
    ))}
  </Chips>
);

const organisationRowHelper = createColumnHelper<OrganisationInventoryRow>();
const organisationColumns = [
  organisationRowHelper.accessor("username", { header: "User" }),
  organisationRowHelper.accessor("units", {
    header: "Units",
    enableColumnFilter: false,
    enableSorting: false,
    cell: ({ getValue }) => (
      <Box component="ul" sx={{ listStyle: "none", m: 0, p: 0 }}>
        {getValue().map((unit) => (
          <li key={unit.id}>
            <MuiLink
              href={withBasePath(
                administrationLinks.usageInventoryResource("units", assertUnitId(unit.id)),
              )}
            >
              {unit.name ?? unit.id} ({unit.projectCount})
            </MuiLink>
          </li>
        ))}
      </Box>
    ),
  }),
  ...activityColumns(organisationRowHelper),
];

const unitRowHelper = createColumnHelper<UnitInventoryRow>();
const unitUserColumns = [
  unitRowHelper.accessor("username", { header: "User" }),
  // The unit's own resource says who belongs to it, which is its members and the owner it names.
  unitRowHelper.accessor("isMember", {
    header: "Unit Member",
    cell: ({ getValue }) =>
      getValue() ? <DoneIcon titleAccess="Member" /> : <CloseIcon titleAccess="Not a member" />,
  }),
  ...activityColumns(unitRowHelper),
  unitRowHelper.group({
    header: "Datasets",
    columns: [
      unitRowHelper.accessor((row) => row.datasets.editor, {
        header: "Editor",
        id: "dataset-editor",
      }),
      unitRowHelper.accessor((row) => row.datasets.owner, { header: "Owner", id: "dataset-owner" }),
    ],
  }),
  // Project roles are reported here and changed on each project's own Manage route, so every
  // membership is a link to the one place that owns it.
  unitRowHelper.group({
    header: "Project Membership",
    columns: [
      unitRowHelper.accessor((row) => row.projects.observer, {
        header: "Observer",
        id: "project-observer",
        enableColumnFilter: false,
        enableSorting: false,
        cell: ({ getValue }) => <ProjectChips projects={getValue()} />,
      }),
      unitRowHelper.accessor((row) => row.projects.editor, {
        header: "Editor",
        id: "project-editor",
        enableColumnFilter: false,
        enableSorting: false,
        cell: ({ getValue }) => <ProjectChips projects={getValue()} />,
      }),
      unitRowHelper.accessor((row) => row.projects.administrator, {
        header: "Administrator",
        id: "project-administrator",
        enableColumnFilter: false,
        enableSorting: false,
        cell: ({ getValue }) => <ProjectChips projects={getValue()} />,
      }),
    ],
  }),
];

const projectRowHelper = createColumnHelper<InventoryProjectRow>();
const projectColumns = [
  projectRowHelper.accessor("name", { header: "Project" }),
  projectRowHelper.group({
    header: "Users",
    columns: [
      projectRowHelper.accessor("observers", {
        header: "Observers",
        enableColumnFilter: false,
        enableSorting: false,
        cell: ({ getValue }) => <UserChips users={getValue()} />,
      }),
      projectRowHelper.accessor("editors", {
        header: "Editors",
        enableColumnFilter: false,
        enableSorting: false,
        cell: ({ getValue }) => <UserChips users={getValue()} />,
      }),
      projectRowHelper.accessor("administrators", {
        header: "Administrators",
        enableColumnFilter: false,
        enableSorting: false,
        cell: ({ getValue }) => <UserChips users={getValue()} />,
      }),
      // This report is read-only: a project's roles are changed on that project's Manage route.
      projectRowHelper.display({
        id: "manage",
        cell: ({ row }) => {
          const href = projectManageHref(row.original.projectId);
          return href ? (
            <MuiLink component={Link} href={href as never}>
              Manage project
            </MuiLink>
          ) : null;
        },
      }),
    ],
  }),
];

const EmptyReport = ({ children }: { children: string }) => (
  <Alert severity="info">{children}</Alert>
);

/**
 * What one report's own read established. A report that could not be refreshed stays readable and
 * says so; a confirmed refusal or absence replaces it. Neither changes the addressed resource, and
 * both keep the same report retryable in place.
 */
const ReportBody = <TReport,>({
  children,
  read,
  refresh,
}: {
  children: (report: TReport) => ReactNode;
  read: InventoryRead<TReport>;
  refresh: () => void;
}) => {
  if (read.kind === "pending") {
    return <CenterLoader />;
  }
  const retry = (
    <Button color="inherit" size="small" onClick={refresh}>
      Retry
    </Button>
  );
  if (read.kind === "unavailable") {
    const { message, retryable, severity } = presentAdministrationFailure(read.failure);
    return (
      <Alert action={retryable ? retry : undefined} severity={severity}>
        {message}
      </Alert>
    );
  }

  return (
    <>
      {read.kind === "stale" ? (
        <Alert action={retry} severity="warning" sx={{ mb: 2 }}>
          This report could not be refreshed and may be out of date.{" "}
          {presentAdministrationFailure(read.failure).message}
        </Alert>
      ) : null}
      {children(read.report)}
    </>
  );
};

/**
 * Every report states the same things about the resource it is about: what the resource is, that it
 * cannot be changed here and where it can be, who owns it, and who belongs to it.
 */
const ReportFrame = ({
  ancestry,
  children,
  id,
  members,
  membershipReason,
  name,
  owner,
  ownerId,
  type,
}: {
  ancestry?: string;
  children: ReactNode;
  id: string;
  members: string[];
  /** Why the caller could not carry out the linked membership change, when it could not. */
  membershipReason?: string;
  name: string;
  owner: MutationOwner;
  ownerId?: string;
  type: string;
}) => (
  <>
    <PageTitle>{task}</PageTitle>
    <ResourceIdentity ancestry={ancestry} id={id} name={name} type={type} />
    <Box sx={{ mt: 2 }}>
      <ReadOnlyNotice owner={owner} reason={membershipReason}>
        This report is read-only. Project roles are changed in that project&apos;s Manage section.
      </ReadOnlyNotice>
    </Box>
    <Box sx={{ mt: 2 }}>
      <Typography>Owner: {ownerId ?? "None"}</Typography>
      <Typography>Members: {members.length === 0 ? "No members" : members.join(", ")}</Typography>
    </Box>
    <Box sx={{ mt: 3 }}>{children}</Box>
    <Typography sx={{ mt: 1 }} variant="caption">
      A user is considered active in a given day if they have used the Data Manager API.
    </Typography>
  </>
);

const SectionTitle = ({ children }: { children: string }) => (
  <Typography gutterBottom component="h4" variant="h6">
    {children}
  </Typography>
);

const OrganisationReport = ({ organisation }: { organisation: OrganisationAllDetail }) => {
  const organisationId = assertOrganisationId(organisation.id);
  const { caller, defaultOrganisationId, freshness } = useAccessFacts();
  const { read, refresh } = useOrganisationInventory(organisationId);
  const membership = evaluateOrganisationMembershipCapability({
    caller,
    freshness,
    isDefaultOrganisation: isDefaultOrganisationResource(organisation.id, defaultOrganisationId),
    organisation,
  });

  return (
    <ReportFrame
      id={organisationId}
      members={organisation.users.map((user) => user.id)}
      membershipReason={membership.status === "enabled" ? undefined : capabilityReason(membership)}
      name={organisation.name}
      owner={organisationAccessOwner("organisations", organisationId)}
      ownerId={organisation.owner_id}
      type="Organisation"
    >
      <SectionTitle>User Usage</SectionTitle>
      <ReportBody read={read} refresh={refresh}>
        {(rows) =>
          rows.length === 0 ? (
            <EmptyReport>
              No users are accounted for in this organisation&apos;s units. A user appears here once
              they belong to one of its units or hold a role in one of their projects.
            </EmptyReport>
          ) : (
            <DataTable columns={organisationColumns} data={rows} searchLabel="Search users" />
          )
        }
      </ReportBody>
    </ReportFrame>
  );
};

const UnitUserPivot = ({ users }: { users: UnitInventoryRow[] }) => {
  if (users.length === 0) {
    return (
      <EmptyReport>
        No users are accounted for in this unit. A user appears here once they belong to the unit or
        hold a role in one of its projects.
      </EmptyReport>
    );
  }
  return <DataTable columns={unitUserColumns} data={users} searchLabel="Search users" />;
};

const UnitProjectPivot = ({ projects }: { projects: InventoryProjectRow[] }) => {
  if (projects.length === 0) {
    return (
      <EmptyReport>
        No projects were reported for this unit. A project appears here once someone holds a role in
        it.
      </EmptyReport>
    );
  }
  return <DataTable columns={projectColumns} data={projects} searchLabel="Search projects" />;
};

const UnitReport = ({
  organisation,
  unit,
}: {
  /** Absent when the addressed unit is readable but is not among the caller's grouped units. */
  organisation?: OrganisationAllDetail;
  unit: UnitAllDetail;
}) => {
  const unitId = assertUnitId(unit.id);
  const { caller, defaultOrganisationId, freshness, personalUnitId } = useAccessFacts();
  const { read, refresh } = useUnitInventory(unit);
  const [pivot, setPivot] = useState<"projects" | "users">("users");
  const membership = evaluateUnitMembershipCapability({
    caller,
    freshness,
    isDefaultOrganisation:
      organisation !== undefined &&
      isDefaultOrganisationResource(organisation.id, defaultOrganisationId),
    isPersonalUnit: isPersonalUnitResource(unit.id, personalUnitId),
    organisation,
    unit,
  });

  return (
    <ReportFrame
      ancestry={organisation?.name}
      id={unitId}
      members={unit.users.map((user) => user.id)}
      membershipReason={membership.status === "enabled" ? undefined : capabilityReason(membership)}
      name={unit.name}
      owner={organisationAccessOwner("units", unitId)}
      ownerId={unit.owner_id}
      type="Unit"
    >
      <SectionTitle>{pivot === "users" ? "User Usage" : "Project Members"}</SectionTitle>
      {/* The pivot stays outside the table it chooses, so a report with nothing to account for can
          still be looked at the other way round. */}
      <ToggleButtonGroup
        exclusive
        aria-label="Report pivot"
        size="small"
        sx={{ mb: 2 }}
        value={pivot}
        onChange={(_, next: "projects" | "users" | null) => next && setPivot(next)}
      >
        <ToggleButton value="users">By user</ToggleButton>
        <ToggleButton value="projects">By project</ToggleButton>
      </ToggleButtonGroup>
      <ReportBody read={read} refresh={refresh}>
        {({ projects, users }) =>
          pivot === "users" ? (
            <UnitUserPivot users={users} />
          ) : (
            <UnitProjectPivot projects={projects} />
          )
        }
      </ReportBody>
    </ReportFrame>
  );
};

const AddressedOrganisationReport = ({ organisationId }: { organisationId: string }) => {
  const addressed = useAddressedOrganisation(organisationId);

  return (
    <AddressedResourceView addressed={addressed} identity={({ id }) => id} task={task}>
      {(organisation) => <OrganisationReport organisation={organisation} />}
    </AddressedResourceView>
  );
};

const AddressedUnitReport = ({ unitId }: { unitId: string }) => {
  const organisation = useUnitAncestry(unitId);
  const addressed = useAddressedUnit(unitId);

  return (
    <AddressedResourceView addressed={addressed} identity={({ id }) => id} task={task}>
      {(unit) => <UnitReport organisation={organisation} unit={unit} />}
    </AddressedResourceView>
  );
};

export const UsageInventoryIndex = () => {
  const { organisations, units } = useAccessIndex();

  return (
    <>
      <PageTitle>{task}</PageTitle>
      <Typography color="text.secondary" sx={{ mb: 2 }}>
        Reports are read-only. Membership changes belong in Organisation &amp; access and project
        roles belong in Project Manage.
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

/**
 * The resource in the address bar answers for itself, so a readable resource keeps its identity and
 * only its ancestry degrades. The report it carries is a second read of its own, which is why a
 * report that could not be refreshed never removes the resource it reports on.
 */
export const UsageInventoryResource = ({ route }: { route: UsageInventoryResourceRoute }) =>
  route.collection === "organisations" ? (
    <AddressedOrganisationReport organisationId={route.resourceId} />
  ) : (
    <AddressedUnitReport unitId={route.resourceId} />
  );
