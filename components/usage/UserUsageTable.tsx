import type { ReactNode } from "react";
import { useMemo } from "react";

import type { InventoryProjectDetail, InventoryUserDetail } from "@squonk/data-manager-client";
import {
  useAddAdministratorToProject,
  useAddEditorToProject,
  useAddObserverToProject,
  useRemoveAdministratorFromProject,
  useRemoveEditorFromProject,
  useRemoveObserverFromProject,
} from "@squonk/data-manager-client/project";

import { Close, Done } from "@mui/icons-material";
import type { UseAutocompleteProps } from "@mui/material";
import { Autocomplete, Chip, TextField, Typography } from "@mui/material";
import { createColumnHelper } from "@tanstack/react-table";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";

import { DATE_FORMAT, TIME_FORMAT } from "../../constants/datetimes";
import { useEnqueueError } from "../../hooks/useEnqueueStackError";
import { DataTable } from "../DataTable";

dayjs.extend(utc);

type UserEntry = InventoryUserDetail & { isEditor: boolean };

const columnHelper = createColumnHelper<UserEntry>();

const getProjectsList = (users: UserEntry[]) =>
  users
    .map((user) => Object.values(user.projects).flat())
    .flat()
    .reduce<InventoryProjectDetail[]>((uniqueProjects, project) => {
      if (!uniqueProjects.some((p) => p.id === project.id)) {
        uniqueProjects.push(project);
      }
      return uniqueProjects;
    }, []);

export interface UserUsageTableProps {
  /**
   * list of users with associated projects
   */
  users: UserEntry[];
  /**
   * Function to call when a user's project membership is changed
   */
  onChange: () => Promise<void>;
  /**
   * Content to display in the toolbar
   */
  toolbarContent?: ReactNode;
}

export const UserUsageTable = ({ users, toolbarContent, onChange }: UserUsageTableProps) => {
  const columns = useMemo(
    () => [
      columnHelper.accessor("username", { header: "User" }),
      columnHelper.accessor("isEditor", {
        header: "Unit Editor",
        cell: ({ row }) => (row.original.isEditor ? <Done /> : <Close />),
      }),
      columnHelper.group({
        header: "Activity",
        columns: [
          columnHelper.accessor("first_seen", {
            header: "First Seen",
            cell: ({ getValue }) => dayjs.utc(getValue()).format(`${DATE_FORMAT} ${TIME_FORMAT}`),
            sortingFn: (a, b) =>
              dayjs.utc(a.original.first_seen).diff(dayjs.utc(b.original.first_seen)),
          }),
          columnHelper.accessor((user) => user.activity.period_b?.active_days, {
            id: "activity_b",
            header: "API Used",
            cell: ({
              row: {
                original: { activity },
              },
            }) =>
              `${activity.period_b?.active_days} of last ${activity.period_b?.monitoring_period}`,
          }),
          columnHelper.accessor((user) => user.activity.period_a.active_days, {
            id: "activity_a",
            header: "",
            cell: ({
              row: {
                original: { activity },
              },
            }) => `${activity.period_a.active_days} of last ${activity.period_a.monitoring_period}`,
          }),
          columnHelper.accessor("last_seen_date", {
            header: "Last Seen",
            cell: ({ getValue }) => dayjs.utc(getValue()).format(DATE_FORMAT),
            sortingFn: (a, b) =>
              dayjs.utc(a.original.last_seen_date).diff(dayjs.utc(b.original.last_seen_date)),
          }),
        ],
      }),

      columnHelper.group({
        header: "Datasets",
        columns: [
          columnHelper.accessor((user) => user.datasets.editor?.length ?? 0, { header: "Editor" }),
          columnHelper.accessor((user) => user.datasets.owner?.length ?? 0, { header: "Owner" }),
        ],
      }),
      columnHelper.group({
        header: "Project Membership",
        columns: [
          columnHelper.accessor((user) => user.projects.observer, {
            header: "Observer",
            cell: ({ getValue, row }) => (
              <ChipsInput
                group="observer"
                username={row.original.username}
                users={users}
                value={getValue()}
                onChange={onChange}
              />
            ),
          }),
          columnHelper.accessor((user) => user.projects.editor, {
            id: "project-editor",
            header: "Editor",
            cell: ({ getValue, row }) => (
              <ChipsInput
                group="editor"
                username={row.original.username}
                users={users}
                value={getValue()}
                onChange={onChange}
              />
            ),
          }),
          columnHelper.accessor((user) => user.projects.administrator, {
            header: "Administrator",
            cell: ({ getValue, row }) => (
              <ChipsInput
                group="administrator"
                username={row.original.username}
                users={users}
                value={getValue()}
                onChange={onChange}
              />
            ),
          }),
        ],
      }),
    ],
    [users, onChange],
  );

  return (
    <>
      <DataTable columns={columns} data={users} toolbarContent={toolbarContent} />
      <Typography variant="caption">
        A user is considered active in a given day if they have used the Data Manager API
      </Typography>
    </>
  );
};

interface ChipsInputProps {
  users: UserEntry[];
  value: InventoryProjectDetail[];
  group: "observer" | "editor" | "administrator";
  username: string;
  onChange: () => Promise<void>;
}

type Handler = UseAutocompleteProps<InventoryProjectDetail, true, false, false>["onChange"];

const ChipsInput = ({ users, value, group, username, onChange }: ChipsInputProps) => {
  const projects = useMemo(() => getProjectsList(users), [users]);

  const { isPending: isPending0, mutateAsync: addObserver } = useAddObserverToProject();
  const { isPending: isPending1, mutateAsync: removeObserver } = useRemoveObserverFromProject();
  const { isPending: isPending2, mutateAsync: addEditor } = useAddEditorToProject();
  const { isPending: isPending3, mutateAsync: removeEditor } = useRemoveEditorFromProject();
  const { isPending: isPending4, mutateAsync: addAdministrator } = useAddAdministratorToProject();
  const { isPending: isPending5, mutateAsync: removeAdministrator } =
    useRemoveAdministratorFromProject();

  const isPending =
    isPending0 || isPending1 || isPending2 || isPending3 || isPending4 || isPending5;

  const { enqueueError, enqueueSnackbar } = useEnqueueError();

  const handleChange: Handler = async (_e, _v, reason, details) => {
    if (details?.option) {
      try {
        switch (reason) {
          case "selectOption": {
            switch (group) {
              case "observer": {
                await addObserver({ projectId: details.option.id, userId: username });
                await onChange();
                enqueueSnackbar("Observer added", { variant: "success" });
                break;
              }
              case "editor": {
                await addEditor({ projectId: details.option.id, userId: username });
                await onChange();
                enqueueSnackbar("Editor added", { variant: "success" });
                break;
              }
              case "administrator": {
                await addAdministrator({ projectId: details.option.id, userId: username });
                await onChange();
                enqueueSnackbar("Administrator added", { variant: "success" });
                break;
              }
            }
            break;
          }

          case "removeOption": {
            switch (group) {
              case "observer": {
                await removeObserver({ projectId: details.option.id, userId: username });
                await onChange();
                enqueueSnackbar("Observer removed", { variant: "success" });
                break;
              }
              case "editor": {
                await removeEditor({ projectId: details.option.id, userId: username });
                await onChange();
                enqueueSnackbar("Editor removed", { variant: "success" });
                break;
              }
              case "administrator": {
                await removeAdministrator({ projectId: details.option.id, userId: username });
                await onChange();
                enqueueSnackbar("Administrator removed", { variant: "success" });
                break;
              }
            }
            break;
          }
        }
      } catch (error) {
        enqueueError(error);
      }
    }
  };

  return (
    <Autocomplete
      disableClearable
      multiple
      disabled={isPending}
      getOptionLabel={(option) => option.name}
      isOptionEqualToValue={(option, value) => option.id === value.id}
      loading={isPending}
      options={projects}
      renderInput={(params) => (
        <TextField
          {...params}
          InputProps={{ ...params.InputProps, disableUnderline: true }}
          label={value.length === 0 ? "Add Project" : undefined}
          sx={{ minWidth: 100 }}
          variant="standard"
        />
      )}
      renderTags={(value, getTagProps) =>
        value.map((option, index) => {
          const { key, ...props } = getTagProps({ index });

          return <Chip key={key} label={option.name} variant="outlined" {...props} />;
        })
      }
      size="small"
      value={value}
      onChange={handleChange}
    />
  );
};
