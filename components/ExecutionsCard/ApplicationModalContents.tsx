import React, { FC, useState } from 'react';
import { useQueryClient } from 'react-query';

import { ApplicationSummary } from '@squonk/data-manager-client';
import { useGetApplication } from '@squonk/data-manager-client/application';
import { getGetInstancesQueryKey, useCreateInstance } from '@squonk/data-manager-client/instance';

import { Grid, MenuItem, TextField } from '@material-ui/core';
import Form from '@rjsf/material-ui';

import { ModalWrapper } from '../Modals/ModalWrapper';
import { CenterLoader } from '../Operations/common/CenterLoader';
import { ProjectId } from '../state/currentProjectHooks';

interface ApplicationModalContentProps {
  open: boolean;
  onClose: () => void;
  applicationId: ApplicationSummary['application_id'];
  projectId: ProjectId;
}

export const ApplicationModalContent: FC<ApplicationModalContentProps> = ({
  open,
  onClose,
  applicationId,
  projectId,
}) => {
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [version, setVersion] = useState<string | null>(null);
  const [formData, setFormData] = useState<any>(null);

  const { mutate: createInstance } = useCreateInstance();

  const { data: application } = useGetApplication(applicationId);

  const handleCreateInstance = async () => {
    if (projectId) {
      createInstance(
        {
          data: {
            application_id: applicationId,
            application_version: version ?? '',
            as_name: name,
            project_id: projectId,
            specification: JSON.stringify({
              variables: formData,
            }),
          },
        },
        {
          onSuccess: () => {
            queryClient.invalidateQueries(getGetInstancesQueryKey());
            onClose();
          },
        },
      );
    }
  };

  const schema = application?.template ? JSON.parse(application.template) : undefined;

  if (schema) {
    schema.title = undefined;
  }

  return (
    <ModalWrapper
      DialogProps={{ maxWidth: 'sm', fullWidth: true }}
      id={`app-${applicationId}`}
      open={open}
      submitDisabled={!projectId || !name || !version}
      submitText="Run"
      title={application?.kind ?? 'Run Job'}
      onClose={onClose}
      onSubmit={handleCreateInstance}
    >
      {application === undefined ? (
        <CenterLoader />
      ) : (
        <Grid container spacing={1}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Instance Name"
              size="small"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              select
              label="Version"
              size="small"
              value={version ?? ''}
              onChange={(e) => setVersion(e.target.value)}
            >
              {application.versions.map((version) => (
                <MenuItem key={version} value={version}>
                  {version}
                </MenuItem>
              ))}
            </TextField>
            <Form
              liveValidate
              noHtml5Validate
              formData={formData}
              schema={schema}
              showErrorList={false} // TODO: fix when openapi is updated
              onChange={(event) => setFormData(event.formData)}
            >
              <div />
            </Form>
          </Grid>
        </Grid>
      )}
    </ModalWrapper>
  );
};
