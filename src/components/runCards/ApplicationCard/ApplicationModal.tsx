import { useState } from "react";

import { type ApplicationSummary } from "@/api/data-manager";
import { useGetApplication } from "@/api/data-manager/application";

import { Grid, TextField, Typography } from "@mui/material";
import Form from "@rjsf/mui";
import validator from "@rjsf/validator-ajv8";

import { capabilityIsEnabled } from "../../../projects/capabilities";
import { launchIsSendable } from "../../../projects/runLaunch";
import { useRunCommands } from "../../../projects/useRunCommands";
import { useRunLaunch } from "../../../projects/useRunLaunch";
import { CenterLoader } from "../../CenterLoader";
import { ModalWrapper } from "../../modals/ModalWrapper";
import { CapabilityReasons } from "../../results/CapabilityReasons";
import { DebugCheckbox, type DebugValue } from "../DebugCheckbox";
import { LaunchFeedback } from "../LaunchFeedback";
import { type RunModalProps } from "../types";

export interface ApplicationModalProps extends RunModalProps {
  /**
   * ID of the application under which an instance will be created
   */
  applicationId: ApplicationSummary["application_id"];
}

/**
 * Modal with a form to create an instance of an application in the project the URL addresses.
 */
export const ApplicationModal = ({
  applicationId,
  capabilities,
  open,
  projectId,
  onClose,
  onLaunched,
}: ApplicationModalProps) => {
  const [name, setName] = useState("");
  const [debug, setDebug] = useState<DebugValue>("0");
  const [formData, setFormData] = useState<any>(null);

  const { launchInstance } = useRunCommands();
  const { attempt, launch } = useRunLaunch(onLaunched);
  const { data: application } = useGetApplication(applicationId);

  // The launch names the project the URL addresses and nothing else, so an application can only
  // ever be run in the project the caller is looking at.
  const handleLaunch = () =>
    void launch(() =>
      launchInstance(projectId, {
        applicationId,
        debug,
        name,
        specification: JSON.stringify({ variables: formData }),
      }),
    );

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
      submitDisabled={
        !capabilityIsEnabled(capabilities.launch) || !name || !launchIsSendable(attempt)
      }
      submitText="Run"
      title={application?.kind ?? "Run application"}
      onClose={onClose}
      onSubmit={handleLaunch}
    >
      {application === undefined ? (
        <CenterLoader />
      ) : (
        <Grid container spacing={1}>
          <Grid size={{ xs: 12 }}>
            <Typography
              sx={{ color: "text.secondary", textTransform: "uppercase", fontWeight: "bold" }}
              variant="caption"
            >
              Application
            </Typography>
            <Typography variant="body2">{application.group}</Typography>
          </Grid>
          <Grid size={{ xs: 12 }}>
            <CapabilityReasons capabilities={[capabilities.launch, capabilities.availability]} />
            <LaunchFeedback attempt={attempt} />
          </Grid>
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
