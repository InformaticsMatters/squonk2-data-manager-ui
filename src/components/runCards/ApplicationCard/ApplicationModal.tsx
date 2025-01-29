import { useState } from "react";

import { type ApplicationSummary, type DmError } from "@squonk/data-manager-client";
import { useGetApplication } from "@squonk/data-manager-client/application";
import { getGetInstancesQueryKey, useCreateInstance } from "@squonk/data-manager-client/instance";

import { Grid2 as Grid, MenuItem, TextField } from "@mui/material";
import Form from "@rjsf/mui";
import validator from "@rjsf/validator-ajv8";
import { useQueryClient } from "@tanstack/react-query";

import { useEnqueueError } from "../../../hooks/useEnqueueStackError";
import { CenterLoader } from "../../CenterLoader";
import { ModalWrapper } from "../../modals/ModalWrapper";
import { DebugCheckbox, type DebugValue } from "../DebugCheckbox";
import { type CommonModalProps } from "../types";

export interface ApplicationModalProps extends CommonModalProps {
  /**
   * ID of the application under which an instance will be created
   */
  applicationId: ApplicationSummary["application_id"];
}

/**
 * Modal with form to create an instance of an application.
 */
export const ApplicationModal = ({
  open,
  onClose,
  applicationId,
  projectId,
  onLaunch,
}: ApplicationModalProps) => {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [debug, setDebug] = useState<DebugValue>("0");
  const [version, setVersion] = useState<string | null>(null);
  const [formData, setFormData] = useState<any>(null);

  const { mutateAsync: createInstance } = useCreateInstance();

  const { enqueueError, enqueueSnackbar } = useEnqueueError<DmError>();

  const { data: application } = useGetApplication(applicationId);

  const versionToUse = version ?? application?.versions[0] ?? "";

  const handleCreateInstance = async () => {
    if (projectId) {
      try {
        const { instance_id: instanceId } = await createInstance({
          data: {
            debug,
            application_id: applicationId,
            // application_version: versionToUse,
            as_name: name,
            project_id: projectId,
            specification: JSON.stringify({
              variables: formData,
            }),
          },
        });
        onLaunch && onLaunch(instanceId);
        await queryClient.invalidateQueries({ queryKey: getGetInstancesQueryKey() });
      } catch (error) {
        enqueueError(error);
      } finally {
        onClose();
      }
    } else {
      enqueueSnackbar("No project provided", { variant: "warning" });
    }
  };

  const schema = application?.template ? JSON.parse(application.template) : undefined;

  if (schema) {
    // Remove the title from the schema so it isn't rendered by the form generator
    schema.title = undefined;
  }

  return (
    <ModalWrapper
      DialogProps={{ maxWidth: "sm", fullWidth: true }}
      id={`app-${applicationId}`}
      open={open}
      submitDisabled={!projectId || !name || !versionToUse}
      submitText="Run"
      title={application?.kind ?? "Run Job"}
      onClose={onClose}
      onSubmit={() => void handleCreateInstance()}
    >
      {application === undefined ? (
        <CenterLoader />
      ) : (
        <Grid container spacing={1}>
          <Grid size={{ xs: 12 }}>
            <TextField
              fullWidth
              label="Instance Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </Grid>

          <DebugCheckbox value={debug} onChange={(debug) => setDebug(debug)} />

          <Grid size={{ xs: 12 }}>
            <TextField
              fullWidth
              select
              label="Version"
              value={versionToUse}
              onChange={(e) => setVersion(e.target.value)}
            >
              {application.versions.map((version) => (
                <MenuItem key={version} value={version}>
                  {version}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid size={{ xs: 12 }}>
            <Form
              liveValidate
              noHtml5Validate
              formData={formData}
              schema={schema}
              showErrorList={false}
              validator={validator}
              onChange={(event) => setFormData(event.formData)}
            >
              {/* Don't render a submit button */}
              <div />
            </Form>
          </Grid>
        </Grid>
      )}
    </ModalWrapper>
  );
};
