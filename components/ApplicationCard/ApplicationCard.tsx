import React, { useState } from 'react';

import { css } from '@emotion/react';
import {
  Button,
  Card,
  CardActions,
  CardContent,
  Collapse,
  Grid,
  IconButton,
  MenuItem,
  TextField,
  Typography,
} from '@material-ui/core';
import ExpandMoreRoundedIcon from '@material-ui/icons/ExpandMoreRounded';
import {
  ApplicationSummary,
  InstanceId,
  InstanceSummary,
  ProjectSummary,
  useCreateInstance,
  useGetApplication,
  useGetInstances,
} from '@squonk/data-manager-client';

import { InstanceDetail } from './InstanceDetail';
import { ProgressBar } from './ProgressBar';

interface ApplicationCardProps {
  app: ApplicationSummary;
  project: ProjectSummary | null;
}

export const ApplicationCard: React.FC<ApplicationCardProps> = ({ app, project }) => {
  const { data: application } = useGetApplication(app.application_id ?? '');

  const { data: instancesData } = useGetInstances();
  const instances = (instancesData as any)?.instances as InstanceSummary[]; // TODO: Fix cast through any due to bug in OpenAPI Spec

  const [name, setName] = useState('');
  const [version, setVersion] = useState<string | null>(null);

  const mutation = useCreateInstance();

  const [isTaskProcessing, setIsTaskProcessing] = useState(false);
  const [currentTask, setCurrentTask] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  return (
    <Card>
      <CardContent>
        <Typography variant="h6">{app.kind}</Typography>
      </CardContent>
      <CardContent>
        <Typography variant="subtitle1" gutterBottom>
          Launch Instance
        </Typography>
        <Grid container spacing={1}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              size="small"
              variant="outlined"
              label="Instance Name"
              onChange={(e) => setName(e.target.value)}
            />
          </Grid>
          <Grid item xs={12}>
            {application && (
              <TextField
                fullWidth
                size="small"
                variant="outlined"
                label="Version"
                select
                defaultValue=""
                onChange={(e) => setVersion(e.target.value)}
              >
                {application.versions?.map((version) => (
                  <MenuItem key={version} value={version}>
                    {version}
                  </MenuItem>
                ))}
              </TextField>
            )}
          </Grid>
          <Grid item xs={12}>
            <ProgressBar
              taskId={currentTask}
              isTaskProcessing={isTaskProcessing}
              setIsTaskProcessing={setIsTaskProcessing}
            />
          </Grid>
        </Grid>
      </CardContent>
      <CardActions
        disableSpacing
        css={css`
          justify-content: center;
        `}
      >
        <Button
          disabled={!project || isTaskProcessing || !name || !version}
          size="small"
          color="primary"
          onClick={async () => {
            setIsTaskProcessing(true);
            const response: InstanceId = await mutation.mutateAsync({
              data: {
                application_id: app.application_id ?? '',
                application_version: version ?? '',
                as_name: name,
                project_id: project?.project_id ?? '',
              },
            });

            response.task_id && setCurrentTask(response.task_id);
          }}
        >
          Create Instance
        </Button>
        <IconButton
          css={css`
            margin-left: auto;
          `}
          onClick={() => setExpanded(!expanded)}
          aria-expanded={expanded}
          aria-label="show instances"
        >
          <ExpandMoreRoundedIcon />
        </IconButton>
      </CardActions>

      <Collapse in={expanded} timeout="auto" unmountOnExit>
        <CardContent>
          <Typography variant="h5">Running Instances</Typography>
          {instances?.length ? (
            instances?.map((instance) => (
              <InstanceDetail key={instance.instance_id} instance={instance} />
            ))
          ) : (
            <Typography variant="body2">No Instances Running</Typography>
          )}
        </CardContent>
      </Collapse>
    </Card>
  );
};
