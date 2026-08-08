import { useState } from "react";

import { type DatasetVersionSummary, type DmError } from "@/api/data-manager";
import { useGetFileTypes } from "@/api/data-manager/type";

import { AttachFileRounded as AttachFileRoundedIcon } from "@mui/icons-material";
import {
  Alert,
  Checkbox,
  CircularProgress,
  FormControl,
  FormControlLabel,
  FormGroup,
  Link as MuiLink,
  ListItemButton,
  ListItemText,
  MenuItem,
  TextField,
} from "@mui/material";
import { useForm } from "@tanstack/react-form";
import NextLink from "next/link";
import { z } from "zod/mini";

import { FormModalWrapper } from "../../../../../components/modals/FormModalWrapper";
import {
  attachmentDestinationPath,
  attachmentDestinationRequirement,
  type AttachmentTarget,
  attachmentTargetLabel,
  datasetAttachmentFailureMessage,
  resolveDatasetAttachment,
} from "../../../../../datasets/attachment";
import { useDatasetAttachmentCommands } from "../../../../../datasets/useDatasetAttachmentCommands";
import { useDatasetAttachmentTargets } from "../../../../../datasets/useDatasetAttachmentTargets";
import { useEnqueueError } from "../../../../../hooks/useEnqueueStackError";
import { projectLinks } from "../../../../../projects/routes";
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

const schema = z.object({
  project: z.string().check(z.minLength(1, "A project is required")),
  type: z.string().check(z.minLength(1, "A file type is required")),
  path: z
    .string()
    .check(
      z.refine((value) => attachmentDestinationPath(value) !== null, {
        message: attachmentDestinationRequirement,
      }),
    ),
  isImmutable: z.boolean(),
  isCompress: z.boolean(),
});

type FormType = z.infer<typeof schema>;

/**
 * What the attachment this form is running has reached. Only a settled task is a success, so the
 * caller is told the version is attached exactly once the file exists in the project it named.
 */
type AttachmentProgress =
  | { kind: "attached"; path: string; target: AttachmentTarget }
  | { kind: "attaching"; target: AttachmentTarget }
  | { kind: "failed"; reason: string }
  | { kind: "idle" };

/**
 * MuiListItem with a click action that opens a modal allowing a dataset to be attached to a project.
 *
 * The target project is always chosen explicitly from the projects the caller may edit, whichever
 * organisation and unit hold them, and it is the only thing that decides where the version lands.
 */
export const AttachDatasetListItem = ({ datasetId, version }: AttachDatasetListItemProps) => {
  const { projects: attachedProjectIds } = version;

  const [open, setOpen] = useState(false);
  const [progress, setProgress] = useState<AttachmentProgress>({ kind: "idle" });

  const { capability, targets } = useDatasetAttachmentTargets();
  const { attach } = useDatasetAttachmentCommands();

  // The type this version is attached as defaults to its own, so the catalogue of types offers
  // alternatives rather than deciding whether the action can be used at all.
  const { data: typesData } = useGetFileTypes();
  const types = typesData?.types;

  const projectNames = useGetAttachedProjectsNames(attachedProjectIds);

  const { enqueueError, enqueueSnackbar } = useEnqueueError<DmError>();

  const defaultValues: FormType = {
    // Nothing is chosen for the caller: a dataset version is attached to the project they named or
    // to no project at all.
    project: "",
    type: version.type,
    path: "",
    isImmutable: true,
    isCompress: false,
  };

  const form = useForm({
    defaultValues,
    validators: { onChange: schema },
    onSubmit: async (values) => {
      const { project, type, path, isImmutable, isCompress } = values.value;
      const resolution = resolveDatasetAttachment(
        {
          compress: isCompress,
          datasetId,
          datasetVersion: version.version,
          immutable: isImmutable,
          path,
          targetProjectId: project,
          type,
        },
        targets,
      );
      if (resolution.kind === "none") {
        setProgress({ kind: "failed", reason: resolution.reason });
        return {};
      }

      setProgress({ kind: "attaching", target: resolution.target });
      try {
        await attach(resolution.request);
        setProgress({ kind: "attached", path: resolution.path, target: resolution.target });
        enqueueSnackbar(`The dataset was attached to ${resolution.target.projectName}`, {
          variant: "success",
        });
      } catch (error) {
        const message = datasetAttachmentFailureMessage(error, {
          datasetId,
          datasetVersion: version.version,
          targetName: resolution.target.projectName,
        });
        // Every failure leaves the entered choices exactly as they are, so the same attachment can
        // be retried in place without being described again. A fact this client cannot classify is
        // stated as a refusal here and reported in the Data Manager's own words beside it.
        setProgress({
          kind: "failed",
          reason: message ?? "The Data Manager refused this attachment. Nothing was attached.",
        });
        if (!message) {
          enqueueError(error);
        }
      }
      return {};
    },
  });

  const formWrapper = {
    handleSubmit: () => form.handleSubmit(),
    reset: () => {
      form.reset();
      setProgress({ kind: "idle" });
    },
    state: {
      // A settled attachment is finished work: sending the same one again would put a second copy
      // of this version in the project, so another attachment starts from a form that was reopened.
      canSubmit:
        form.state.canSubmit && capability.status === "enabled" && progress.kind !== "attached",
      isSubmitting: form.state.isSubmitting,
    },
  };

  return (
    <>
      {/* The action stays visible whatever the caller can edit, and an unusable one is read beside
          itself rather than only in a tooltip nothing but a pointer would reveal. */}
      <ListItemButton disabled={capability.status !== "enabled"} onClick={() => setOpen(true)}>
        <ListItemText
          primary="Attach Dataset to a Project"
          secondary={
            <>
              Creates a file in the project linked to the selected version
              {capability.status === "disabled" && (
                <>
                  <br />
                  {capability.reason}
                </>
              )}
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
                helperText={
                  field.state.meta.errors[0]?.message ??
                  "Every project you can edit is listed with the unit and organisation that hold it."
                }
                id="select-project"
                label="Project"
                slotProps={{ inputLabel: { shrink: true }, select: { displayEmpty: true } }}
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
              >
                <MenuItem disabled value="">
                  Select a project
                </MenuItem>
                {targets.map((target) => (
                  <MenuItem key={target.projectId} value={target.projectId}>
                    {attachmentTargetLabel(target)}
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
                  .toSorted((a, b) => a.mime.localeCompare(b.mime)) // Sort alphabetically
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

        {progress.kind === "attaching" && (
          <Alert icon={<CircularProgress size="1rem" />} severity="info">
            Attaching to {progress.target.projectName}. This dataset version is unchanged until the
            Data Manager finishes.
          </Alert>
        )}
        {progress.kind === "attached" && (
          <Alert severity="success">
            Attached to {attachmentTargetLabel(progress.target)}.{" "}
            <MuiLink
              component={NextLink}
              href={projectLinks.files(progress.target.projectId, { path: progress.path }) as never}
            >
              Open {progress.target.projectName} files
            </MuiLink>
          </Alert>
        )}
        {progress.kind === "failed" && (
          <Alert severity="error">
            <b>Error:</b> {progress.reason}
          </Alert>
        )}
      </FormModalWrapper>
    </>
  );
};
