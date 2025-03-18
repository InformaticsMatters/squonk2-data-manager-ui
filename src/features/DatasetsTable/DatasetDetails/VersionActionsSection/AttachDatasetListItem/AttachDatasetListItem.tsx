import { useState } from "react";

import { type DatasetVersionSummary, type DmError } from "@squonk/data-manager-client";
import { getGetDatasetsQueryKey } from "@squonk/data-manager-client/dataset";
import { getGetFilesQueryKey, useAttachFile } from "@squonk/data-manager-client/file-and-path";
import { useGetProjects } from "@squonk/data-manager-client/project";
import { useGetFileTypes } from "@squonk/data-manager-client/type";

import { AttachFileRounded as AttachFileRoundedIcon } from "@mui/icons-material";
import {
  Alert,
  Checkbox,
  FormControl,
  FormControlLabel,
  FormGroup,
  ListItemButton,
  ListItemText,
  MenuItem,
  TextField,
} from "@mui/material";
import { useForm } from "@tanstack/react-form";
import { useQueryClient } from "@tanstack/react-query";
import { z } from "zod";

import { FormModalWrapper } from "../../../../../components/modals/FormModalWrapper";
import { useEnqueueError } from "../../../../../hooks/useEnqueueStackError";
import { useKeycloakUser } from "../../../../../hooks/useKeycloakUser";
import { getErrorMessage } from "../../../../../utils/next/orvalError";
import { useGetAttachedProjectsNames } from "./useGetAttachedProjectsNames";

export interface AttachDatasetListItemProps {
  /**
   * The dataset-id corresponding to the dataset which will be attached.
   */
  datasetId: string;
  /**
   * The {@link DatasetVersionSummary version} of the dataset to be attached
   */
  version: DatasetVersionSummary;
}

// Define schema for validation
const schema = z.object({
  project: z.string().min(1, "A project is required"),
  type: z.string().min(1, "A file type is required"),
  path: z
    .string()
    .regex(/^\/([A-z0-9-_+]+\/)*([A-z0-9]+)$/gmu, "Invalid Path")
    .or(z.literal("")),
  isImmutable: z.boolean(),
  isCompress: z.boolean(),
});

type FormType = z.infer<typeof schema>;

/**
 * MuiListItem with a click action that opens a modal allowing a dataset to be attached to a project
 */
export const AttachDatasetListItem = ({ datasetId, version }: AttachDatasetListItemProps) => {
  const { projects: projectIds } = version;

  const [open, setOpen] = useState(false);

  const { user, isLoading: isUserLoading } = useKeycloakUser();

  const queryClient = useQueryClient();
  const { mutateAsync: attachFile, error } = useAttachFile();
  const errorMessage = getErrorMessage(error);

  const { data: projectsData, isLoading: isProjectsLoading } = useGetProjects();
  const projects = projectsData?.projects.filter(
    ({ editors, administrators }) =>
      user.username && (editors.includes(user.username) || administrators.includes(user.username)),
  );

  const { data: typesData, isLoading: isTypesLoading } = useGetFileTypes();
  const types = typesData?.types;

  const projectNames = useGetAttachedProjectsNames(projectIds, projectsData?.projects);

  const { enqueueError, enqueueSnackbar } = useEnqueueError<DmError>();

  const form = useForm({
    defaultValues: {
      project: projects?.[0]?.project_id ?? "",
      type: version.type,
      path: "",
      isImmutable: true,
      isCompress: false,
    } as FormType,
    validators: { onChange: schema },
    onSubmit: async (values) => {
      const { project, type, path, isImmutable, isCompress } = values.value;
      const resolvedPath = path || "/";

      try {
        await attachFile({
          data: {
            dataset_version: version.version,
            dataset_id: datasetId,
            project_id: project,
            immutable: isImmutable,
            compress: isCompress,
            as_type: type,
            path: resolvedPath,
          },
        });

        await Promise.allSettled([
          // Ensure the views showing project files is updated to include the new addition
          queryClient.invalidateQueries({
            queryKey: getGetFilesQueryKey({ project_id: project, path: resolvedPath }),
          }),
          // Ensure that the dataset's details display the project's name in the used in projects
          // field
          queryClient.invalidateQueries({ queryKey: getGetDatasetsQueryKey() }),
        ]);

        enqueueSnackbar("The dataset was successfully attached to your project", {
          variant: "success",
        });
        setOpen(false);
        return {};
      } catch (error) {
        enqueueError(error);
        return {};
      }
    },
  });

  const formWrapper = {
    handleSubmit: () => form.handleSubmit(),
    reset: () => {
      form.reset();
    },
    state: {
      canSubmit: form.state.canSubmit,
      isSubmitting: form.state.isSubmitting,
    },
  };

  return (
    <>
      <ListItemButton
        disabled={isProjectsLoading || isTypesLoading || isUserLoading}
        onClick={() => setOpen(true)}
      >
        <ListItemText
          primary="Attach Dataset to a Project"
          secondary={
            <>
              Creates a file in the project linked to the selected version
              {projectNames.length > 0 && (
                <>
                  <br />
                  Currently attached to: {projectNames.join(", ")}
                </>
              )}
            </>
          }
        />
        <AttachFileRoundedIcon color="action" />
      </ListItemButton>
      <FormModalWrapper
        DialogProps={{ maxWidth: "sm", fullWidth: true }}
        form={formWrapper}
        id={`attach-dataset-${datasetId}`}
        open={open}
        submitText="Attach"
        title={`Attach ${version.file_name} v${version.version} to a Project`}
        onClose={() => setOpen(false)}
      >
        <FormControl fullWidth margin="dense">
          <form.Field name="project">
            {(field) => (
              <TextField
                select
                error={!!field.state.meta.errors[0]}
                helperText={field.state.meta.errors[0]?.message}
                id="select-project"
                label="Project"
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
              >
                {(projects ?? []).map((project) => (
                  <MenuItem key={project.project_id} value={project.project_id}>
                    {project.name}
                  </MenuItem>
                ))}
              </TextField>
            )}
          </form.Field>
        </FormControl>

        <FormControl fullWidth margin="dense">
          <form.Field name="type">
            {(field) => (
              <TextField
                select
                error={!!field.state.meta.errors[0]}
                helperText={
                  field.state.meta.errors[0]?.message ??
                  "The desired Dataset file type (a MIME type). Whether or not the chosen fileType is supported will depend on the Dataset."
                }
                id="select-type"
                label="File Type"
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
              >
                {(types ?? [])
                  .sort((a, b) => a.mime.localeCompare(b.mime)) // Sort alphabetically
                  .map((type) => (
                    <MenuItem key={type.mime} value={type.mime}>
                      {type.mime}
                    </MenuItem>
                  ))}
              </TextField>
            )}
          </form.Field>
        </FormControl>

        <FormGroup row>
          <form.Field name="isImmutable">
            {(field) => (
              <FormControlLabel
                control={
                  <Checkbox
                    checked={field.state.value}
                    onChange={(e) => field.handleChange(e.target.checked)}
                  />
                }
                label="Immutable"
              />
            )}
          </form.Field>
          <form.Field name="isCompress">
            {(field) => (
              <FormControlLabel
                control={
                  <Checkbox
                    checked={field.state.value}
                    onChange={(e) => field.handleChange(e.target.checked)}
                  />
                }
                label="Compress"
              />
            )}
          </form.Field>
        </FormGroup>

        <FormControl fullWidth margin="normal">
          <form.Field name="path">
            {(field) => (
              <TextField
                error={!!field.state.meta.errors[0]}
                helperText={
                  field.state.meta.errors[0]?.message ??
                  "A path within the Project to add the File, default is the project root ('/'), the mount-point within the application container. For example a valid path is '/path/subpath'."
                }
                label="Path"
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
              />
            )}
          </form.Field>
        </FormControl>

        {!!errorMessage && (
          <Alert severity="error">
            <b>Error:</b> {errorMessage}
          </Alert>
        )}
      </FormModalWrapper>
    </>
  );
};
