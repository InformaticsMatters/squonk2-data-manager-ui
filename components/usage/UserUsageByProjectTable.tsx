import type { ReactNode } from "react";
import { useMemo, useState } from "react";

import type { InventoryUserDetail } from "@squonk/data-manager-client";

import { Edit } from "@mui/icons-material";
import { Chip, Typography } from "@mui/material";
import { createColumnHelper } from "@tanstack/react-table";
import groupBy from "just-group-by";

import { Chips } from "../Chips";
import { DataTable } from "../DataTable";
import { EditProjectModal } from "../projects/EditProjectButton/EditProjectModal";

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
      columnHelper.display({
        id: "icon",
        cell: () => <Edit />,
      }),
    ],
  }),
];

const pivotProjects = (users: InventoryUserDetail[]) => {
  // add username to each project and flatten them all to a single array
  const flat_projects = users
    .map((user) =>
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
    )
    .flat();

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
   * callback for when a change is made, usually used to invalidate queries
   */
  onChange: () => Promise<void>;
  /**
   * toolbar content
   */
  toolbarContent?: ReactNode;
}

export const UserUsageByProjectTable = ({
  users,
  onChange,
  toolbarContent,
}: UserUsageByProjectTableProps) => {
  const projects = useMemo(() => pivotProjects(users), [users]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | undefined>(undefined);
  const selectedProject = projects.find((project) => project.project_id === selectedProjectId);

  return (
    <>
      {selectedProject && (
        <EditProjectModal
          open={!!selectedProjectId}
          projectId={selectedProject.project_id}
          onClose={() => setSelectedProjectId(undefined)}
          onMemberChange={onChange}
        />
      )}

      <Typography gutterBottom variant="h4">
        Project Members
      </Typography>
      <DataTable
        columns={columns}
        customRowProps={(row) => ({
          hover: true,
          sx: { cursor: "pointer" },
          onClick: () => {
            setSelectedProjectId(row.original.project_id);
          },
        })}
        data={projects}
        toolbarContent={toolbarContent}
      />
    </>
  );
};
