import { useGetUserInventory } from "@squonk/data-manager-client/inventory";

import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";

dayjs.extend(utc);

import { type UserDetail } from "@squonk/account-server-client";
import { useGetOrganisation } from "@squonk/account-server-client/organisation";
import { useGetUnits } from "@squonk/account-server-client/unit";
import { useGetOrganisationUsers } from "@squonk/account-server-client/user";
import { type InventoryUserDetail } from "@squonk/data-manager-client";

import { Alert, Container, Typography } from "@mui/material";
import { createColumnHelper } from "@tanstack/react-table";

import { CenterLoader } from "../CenterLoader";
import { DataTable } from "../DataTable";
import { NextLink } from "../NextLink";
import { getSharedColumns, type UserActivity } from "./sharedColumns";

type Unit = {
  id: string;
  name?: string;
};

type InventoryWithUnit = UserActivity & {
  username: InventoryUserDetail["username"];
  units: Unit[];
};

const columnHelper = createColumnHelper<InventoryWithUnit>();
const sharedColumns = getSharedColumns(columnHelper);

export interface OrganisationUserUsageProps {
  organisationId: string;
}

export const OrganisationUserUsage = ({ organisationId }: OrganisationUserUsageProps) => {
  const { data: organisation, isLoading: isOrganisationLoading } =
    useGetOrganisation(organisationId);
  const { data: units } = useGetUnits({
    query: { select: (data) => data.units.flatMap((org) => org.units) },
  });
  const { data, error: inventoryError } = useGetUserInventory<InventoryWithUnit[]>(
    { org_id: organisationId },
    {
      query: {
        retry: false,
        select: (data) => {
          return data.users.map(({ projects, activity, first_seen, last_seen_date, username }) => ({
            username,
            activity,
            first_seen,
            last_seen_date,
            units: Object.values(projects)
              .flat()
              .map(({ unit_id }) => ({
                id: unit_id,
                name: units?.find((unit) => unit.id === unit_id)?.name,
              }))
              .reduce<Unit[]>((uniqueUnits, unit) => {
                // keep only unique units
                const existingUnit = uniqueUnits.find((u) => u.id === unit.id);
                if (!existingUnit) {
                  uniqueUnits.push(unit);
                }
                return uniqueUnits;
              }, []),
          }));
        },
      },
    },
  );
  const { data: organisationMembers } = useGetOrganisationUsers(organisationId, {
    query: {
      enabled: isOrganisationLoading || !organisation || organisation.caller_is_member,
    },
  });

  const columns = [
    columnHelper.accessor("username", { header: "User" }),
    columnHelper.accessor("units", {
      header: "Units",
      cell: ({ getValue }) => {
        // keep only the unique units
        const units = getValue();

        return (
          <ul>
            {units.map((unit) => (
              <li key={unit.id}>
                <NextLink
                  component="a"
                  href={{ pathname: "/unit/[unitId]/inventory", query: { unitId: unit.id } }}
                >
                  {unit.name}
                </NextLink>
              </li>
            ))}
          </ul>
        );
      },
    }),
    ...sharedColumns,
  ];

  if (inventoryError?.message === "Request failed with status code 403") {
    return <Alert severity="error">You do not have permission to view this inventory</Alert>;
  }

  if (inventoryError) {
    return <Alert severity="error">{inventoryError.message}</Alert>;
  }

  if (data === undefined) {
    return <CenterLoader />;
  }

  return (
    <Container maxWidth="xl">
      <Typography component="h2" variant="h1">
        Organisation Inventory
      </Typography>
      <Typography variant="h3">
        Organisation: <em>{organisation?.name}</em>
      </Typography>

      <Typography>Owner: {organisation?.owner_id}</Typography>
      <OrganisationMembers users={organisationMembers?.users} />
      <DataTable columns={columns} data={data} />
    </Container>
  );
};

const OrganisationMembers = ({ users }: { users: UserDetail[] | undefined }) => {
  // loading
  if (users === undefined) {
    return "Members: ";
  }

  // empty
  if (users.length === 0) {
    return (
      <Typography>
        Members: <em>No members</em>
      </Typography>
    );
  }

  return <Typography>Members: {users.map((user) => user.id).join(", ")}</Typography>;
};
