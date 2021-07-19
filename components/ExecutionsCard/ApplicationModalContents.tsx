import React, { FC, useState } from 'react';
import { useQueryClient } from 'react-query';

import { ApplicationSummary } from '@squonk/data-manager-client';
import { useGetApplication } from '@squonk/data-manager-client/application';
import { getGetInstancesQueryKey, useCreateInstance } from '@squonk/data-manager-client/instance';

import { Grid, MenuItem, TextField } from '@material-ui/core';

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

  return (
    <ModalWrapper
      DialogProps={{ maxWidth: 'sm', fullWidth: true }}
      id={`app-${applicationId}`}
      open={open}
      submitDisabled={!!(!projectId || !name || !version)}
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
              onChange={(e) => setName(e.target.value)}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              select
              defaultValue=""
              label="Version"
              size="small"
              onChange={(e) => setVersion(e.target.value)}
            >
              {application.versions.map((version) => (
                <MenuItem key={version} value={version}>
                  {version}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
        </Grid>
      )}
    </ModalWrapper>
  );
};
