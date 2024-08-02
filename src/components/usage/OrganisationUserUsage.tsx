import { useGetUserInventory } from "@squonk/data-manager-client/inventory";

import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";

dayjs.extend(utc);

import { type UserDetail } from "@squonk/account-server-client";
import { useGetOrganisation } from "@squonk/account-server-client/organisation";
import { useGetOrganisationUnits } from "@squonk/account-server-client/unit";
import { useGetOrganisationUsers } from "@squonk/account-server-client/user";
import { type InventoryUserDetail } from "@squonk/data-manager-client";
import { useGetProjects } from "@squonk/data-manager-client/project";

import { Alert, Container, Typography } from "@mui/material";
import { createColumnHelper } from "@tanstack/react-table";

import { CenterLoader } from "../CenterLoader";
import { DataTable } from "../DataTable";
import { NextLink } from "../NextLink";
import { getSharedColumns, type UserActivity } from "./sharedColumns";

type Unit = {
  id: string;
  name?: string;
  number_of_projects: number;
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

const useOranisationUsersData = (organisationId: string) => {
  const { data: organisation } = useGetOrganisation(organisationId);
  const { data: units } = useGetOrganisationUnits(organisationId, {
    query: { select: (data) => data.units },
  });
  const { data: allProjects } = useGetProjects(undefined, {
    query: { select: (data) => data.projects },
  });
  const { data, error } = useGetUserInventory<InventoryWithUnit[]>(
    { org_id: organisationId },
    {
      query: {
        retry: false,
        select: (data) => {
          return data.users
            .map(({ projects, activity, first_seen, last_seen_date, username }) => {
              // get all the unique units from the projects
              // include the unit name from the units response
              const touchableProjects = [projects.administrator, projects.editor].flat();
              const inventoryUnits = touchableProjects
                .map(({ unit_id }) => ({
                  id: unit_id,
                  name: units?.find((unit) => unit.id === unit_id)?.name,
                  number_of_projects: touchableProjects.reduce((count, project) => {
                    return project.unit_id === unit_id ? count + 1 : count;
                  }, 0),
                }))
                .reduce<Unit[]>((uniqueUnits, unit) => {
                  // keep only unique units
                  const existingUnit = uniqueUnits.find((u) => u.id === unit.id);
                  if (!existingUnit) {
                    uniqueUnits.push(unit);
                  }
                  return uniqueUnits;
                }, []);

              // include the units from the units response missing from the inventory that the user
              // is a member
              const newUnits: Unit[] =
                units
                  ?.filter((unit) => {
                    const foundUnit = inventoryUnits.find((u) => u.id !== unit.id);
                    if (foundUnit === undefined) {
                      return false;
                    } else if (
                      (organisation?.users ?? []).map((user) => user.id).includes(username) ||
                      organisation?.owner_id === username ||
                      unit.owner_id === username ||
                      unit.users.map((user) => user.id).includes(username)
                    ) {
                      return true;
                    }
                    return false;
                  })
                  .map((unit) => ({
                    id: unit.id,
                    name: unit.name,
                    number_of_projects:
                      allProjects?.filter(
                        (project) =>
                          project.unit_id === unit.id &&
                          (project.editors.includes(username) ||
                            project.administrators.includes(username)),
                      ).length ?? 0,
                  })) ?? [];

              const allUnits = [...inventoryUnits, ...newUnits];

              return {
                username,
                activity,
                first_seen,
                last_seen_date,

                units: allUnits,
              };
            })
            .filter((user) => user.units.length > 0);
        },
      },
    },
  );

  return { data, error };
};

export const OrganisationUserUsage = ({ organisationId }: OrganisationUserUsageProps) => {
  const { data: organisation, isLoading: isOrganisationLoading } =
    useGetOrganisation(organisationId);

  const { data: organisationMembers } = useGetOrganisationUsers(organisationId, {
    query: {
      enabled: isOrganisationLoading || !organisation || organisation.caller_is_member,
    },
  });
  const { data, error: inventoryError } = useOranisationUsersData(organisationId);

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
                  {unit.name ?? unit.id} ({unit.number_of_projects})
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
