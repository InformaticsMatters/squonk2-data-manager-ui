import { type ReactNode, useMemo } from "react";

import { type InventoryProjectDetail, type InventoryUserDetail } from "@squonk/data-manager-client";
import {
  useAddAdministratorToProject,
  useAddEditorToProject,
  useAddObserverToProject,
  useRemoveAdministratorFromProject,
  useRemoveEditorFromProject,
  useRemoveObserverFromProject,
} from "@squonk/data-manager-client/project";

import { Close, Done } from "@mui/icons-material";
import {
  Autocomplete,
  Chip,
  TextField,
  Typography,
  type UseAutocompleteProps,
} from "@mui/material";
import { createColumnHelper } from "@tanstack/react-table";

import { useEnqueueError } from "../../hooks/useEnqueueStackError";
import { DataTable } from "../DataTable";
import { getSharedColumns } from "./sharedColumns";

export interface UserEntry extends InventoryUserDetail {
  isEditor: boolean;
}

const columnHelper = createColumnHelper<UserEntry>();
const sharedColumns = getSharedColumns(columnHelper);

const getProjectsList = (users: UserEntry[]) =>
  users
    .flatMap((user) => Object.values(user.projects).flat())
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
      ...sharedColumns,
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
            enableColumnFilter: false,
            enableSorting: false,
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
            enableColumnFilter: false,
            enableSorting: false,
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
            enableColumnFilter: false,
            enableSorting: false,
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
      <Typography gutterBottom variant="h4">
        User Usage
      </Typography>

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
  group: "administrator" | "editor" | "observer";
  username: string;
  onChange: () => Promise<void>;
}

type Handler = NonNullable<
  UseAutocompleteProps<InventoryProjectDetail, true, false, false>["onChange"]
>;
type AsyncHandler = (...args: Parameters<Handler>) => Promise<ReturnType<Handler>>;

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

  const handleChange: AsyncHandler = async (_e, _v, reason, details) => {
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
      filterSelectedOptions
      multiple
      disabled={isPending}
      getOptionLabel={(option) => option.name}
      isOptionEqualToValue={(option, value) => option.id === value.id}
      loading={isPending}
      options={projects}
      renderInput={(params) => (
        <TextField
          {...params}
          label={value.length === 0 ? "Add Project" : undefined}
          slotProps={{ input: { ...params.InputProps, disableUnderline: true } }}
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
      onChange={(...args) => void handleChange(...args)}
    />
  );
};
