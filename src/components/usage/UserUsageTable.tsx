import { type ReactNode } from "react";

import { type InventoryProjectDetail, type InventoryUserDetail } from "@/api/data-manager";

import { Close, Done } from "@mui/icons-material";
import { Chip, Typography } from "@mui/material";
import { createColumnHelper } from "@tanstack/react-table";
import Link from "next/link";

import { projectLinks } from "../../projects/routes";
import { isProjectId } from "../../routing/identifiers";
import { Chips } from "../Chips";
import { DataTable } from "../DataTable";
import { getSharedColumns } from "./sharedColumns";

export interface UserEntry extends InventoryUserDetail {
  isEditor: boolean;
}

const columnHelper = createColumnHelper<UserEntry>();
const sharedColumns = getSharedColumns(columnHelper);

export interface UserUsageTableProps {
  /**
   * list of users with associated projects
   */
  users: UserEntry[];
  /**
   * Content to display in the toolbar
   */
  toolbarContent?: ReactNode;
}

const columns = [
  columnHelper.accessor("username", { header: "User" }),
  columnHelper.accessor("isEditor", {
    header: "Unit Editor",
    cell: ({ row }) => (row.original.isEditor ? <Done /> : <Close />),
  }),
  ...sharedColumns,
  columnHelper.group({
    header: "Datasets",
    columns: [
      columnHelper.accessor((user) => user.datasets.editor?.length ?? 0, { header: "Editor" }),
      columnHelper.accessor((user) => user.datasets.owner?.length ?? 0, { header: "Owner" }),
    ],
  }),
  // Project roles are reported here and changed on each project's own Manage route, so every
  // membership is a link to the one place that owns it.
  columnHelper.group({
    header: "Project Membership",
    columns: [
      columnHelper.accessor((user) => user.projects.observer, {
        header: "Observer",
        enableColumnFilter: false,
        enableSorting: false,
        cell: ({ getValue }) => <ProjectChips projects={getValue()} />,
      }),
      columnHelper.accessor((user) => user.projects.editor, {
        id: "project-editor",
        enableColumnFilter: false,
        enableSorting: false,
        header: "Editor",
        cell: ({ getValue }) => <ProjectChips projects={getValue()} />,
      }),
      columnHelper.accessor((user) => user.projects.administrator, {
        header: "Administrator",
        enableColumnFilter: false,
        enableSorting: false,
        cell: ({ getValue }) => <ProjectChips projects={getValue()} />,
      }),
    ],
  }),
];

export const UserUsageTable = ({ users, toolbarContent }: UserUsageTableProps) => (
  <>
    <Typography gutterBottom variant="h4">
      User Usage
    </Typography>

    <DataTable columns={columns} data={users} toolbarContent={toolbarContent} />
    <Typography variant="caption">
      A user is considered active in a given day if they have used the Data Manager API
    </Typography>
  </>
);

/**
 * The projects one user holds a role in, as read-only chips. Each links to that project's Manage
 * route, which is the only owner of project roles.
 */
const ProjectChips = ({ projects }: { projects: InventoryProjectDetail[] }) => (
  <Chips>
    {projects.map((project) =>
      // A report is read from whatever the inventory returned, so an identifier the route family
      // would not accept stays readable here rather than taking the whole report down with it.
      isProjectId(project.id) ? (
        <Chip
          clickable
          component={Link}
          href={projectLinks.manage(project.id) as never}
          key={project.id}
          label={project.name}
          size="small"
          variant="outlined"
        />
      ) : (
        <Chip key={project.id} label={project.name} size="small" variant="outlined" />
      ),
    )}
  </Chips>
);
