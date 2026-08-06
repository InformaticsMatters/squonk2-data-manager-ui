import { type ReactNode, useMemo } from "react";

import { type InventoryUserDetail } from "@/api/data-manager";

import { Chip, Link as MuiLink, Typography } from "@mui/material";
import { createColumnHelper } from "@tanstack/react-table";
import groupBy from "just-group-by";
import Link from "next/link";

import { projectLinks } from "../../projects/routes";
import { isProjectId } from "../../routing/identifiers";
import { Chips } from "../Chips";
import { DataTable } from "../DataTable";

type PivotProject = {
  project_id: string;
  name: string;
  observers: string[];
  editors: string[];
  administrators: string[];
};

const columnHelper = createColumnHelper<PivotProject>();

const UserChips = ({ users }: { users: string[] }) => (
  <Chips>
    {users.map((user: string) => (
      <Chip key={user} label={user} size="small" />
    ))}
  </Chips>
);

const columns = [
  columnHelper.accessor("name", { header: "Project" }),
  columnHelper.group({
    header: "Users",
    columns: [
      columnHelper.accessor("observers", {
        header: "Observers",
        cell: ({ getValue }) => <UserChips users={getValue()} />,
      }),
      columnHelper.accessor("editors", {
        header: "Editors",
        cell: ({ getValue }) => <UserChips users={getValue()} />,
      }),
      columnHelper.accessor("administrators", {
        header: "Administrators",
        cell: ({ getValue }) => <UserChips users={getValue()} />,
      }),
      // This report is read-only: a project's roles are changed on that project's Manage route. An
      // identifier the route family would not accept keeps its row rather than failing the report.
      columnHelper.display({
        id: "manage",
        cell: ({ row }) =>
          isProjectId(row.original.project_id) ? (
            <MuiLink component={Link} href={projectLinks.manage(row.original.project_id) as never}>
              Manage project
            </MuiLink>
          ) : null,
      }),
    ],
  }),
];

const pivotProjects = (users: InventoryUserDetail[]) => {
  // add username to each project and flatten them all to a single array
  const flat_projects = users.flatMap((user) =>
    [
      user.projects.observer.map((project) => ({
        ...project,
        username: user.username,
        permission: "observer",
      })),
      user.projects.editor.map((project) => ({
        ...project,
        username: user.username,
        permission: "editor",
      })),
      user.projects.administrator.map((project) => ({
        ...project,
        username: user.username,
        permission: "administrator",
      })),
    ].flat(),
  );

  // group usernames by project
  // create a key from the id and name (even though the id is unique, this is so we keep the name and id together)
  return Object.entries(groupBy(flat_projects, (project) => project.id + "+" + project.name)).map(
    ([key, projects]) => ({
      project_id: key.slice(0, key.indexOf("+")),
      name: key.slice(key.indexOf("+") + 1),
      observers: projects
        .filter((project) => project.permission === "observer")
        .map((project) => project.username),
      editors: projects
        .filter((project) => project.permission === "editor")
        .map((project) => project.username),
      administrators: projects
        .filter((project) => project.permission === "administrator")
        .map((project) => project.username),
    }),
  ) satisfies PivotProject[];
};

export interface UserUsageByProjectTableProps {
  /**
   * users to display
   */
  users: InventoryUserDetail[];
  /**
   * toolbar content
   */
  toolbarContent?: ReactNode;
}

export const UserUsageByProjectTable = ({
  users,
  toolbarContent,
}: UserUsageByProjectTableProps) => {
  const projects = useMemo(() => pivotProjects(users), [users]);

  return (
    <>
      <Typography gutterBottom variant="h4">
        Project Members
      </Typography>
      <DataTable columns={columns} data={projects} toolbarContent={toolbarContent} />
    </>
  );
};
