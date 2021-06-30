import React, { FC, useState } from 'react';

import {
  Button,
  ButtonProps,
  Grid,
  MenuItem,
  TextField,
  Tooltip,
  useTheme,
} from '@material-ui/core';
import { ApplicationSummary, ProjectSummary } from '@squonk/data-manager-client';
import { useGetApplication } from '@squonk/data-manager-client/application';
import { useCreateInstance } from '@squonk/data-manager-client/instance';

import { BaseCard } from './BaseCard';
import { ProgressBar } from './ProgressBar';

interface ApplicationCardProps {
  app: ApplicationSummary;
  project: ProjectSummary | null;
}

export const ApplicationCard: FC<ApplicationCardProps> = ({ app, project }) => {
  const { data: application } = useGetApplication(app.application_id);

  const [name, setName] = useState('');
  const [version, setVersion] = useState<string | null>(null);

  const createInstanceMutation = useCreateInstance();

  const [isTaskProcessing, setIsTaskProcessing] = useState(false);
  const [currentTask, setCurrentTask] = useState<string | null>(null);

  const isCreationEnabled = !(!project || isTaskProcessing || !name || !version);

  const handleCreateInstance = async () => {
    setIsTaskProcessing(true);
    if (project) {
      const response = await createInstanceMutation.mutateAsync({
        data: {
          application_id: app.application_id,
          application_version: version ?? '',
          as_name: name,
          project_id: project.project_id,
        },
      });
      setCurrentTask(response.task_id);
    }
  };

  const theme = useTheme();

  return (
    <BaseCard
      cardType="Application"
      applicationId={app.application_id}
      title={app.kind}
      subtitle={application?.group}
      actions={
        <CreateInstanceButton disabled={!isCreationEnabled} onClick={handleCreateInstance} />
      }
      color={theme.palette.secondary.dark}
    >
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
          {application && (
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
          )}
        </Grid>
        <Grid item xs={12}>
          <ProgressBar
            isTaskProcessing={isTaskProcessing}
            setIsTaskProcessing={setIsTaskProcessing}
            taskId={currentTask}
            endState="STARTED"
          />
        </Grid>
      </Grid>
    </BaseCard>
  );
};

const CreateInstanceButton: FC<ButtonProps> = ({ disabled, ...buttonProps }) => {
  return (
    <Tooltip
      arrow
      title={
        disabled
          ? 'Ensure a project is selected and a name & version is provided'
          : 'Create an instance of this app'
      }
    >
      <span>
        <Button color="primary" size="small" disabled={disabled} {...buttonProps}>
          Create Instance
        </Button>
      </span>
    </Tooltip>
  );
};
