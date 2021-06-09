import React, { useState } from 'react';

import { css } from '@emotion/react';
import {
  Avatar,
  Button,
  Card,
  CardActions,
  CardContent,
  CardHeader,
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
  const { data: application } = useGetApplication(app.application_id);

  const { data: instancesData } = useGetInstances();
  const instances = instancesData?.instances;

  const [name, setName] = useState('');
  const [version, setVersion] = useState<string | null>(null);

  const mutation = useCreateInstance();

  const [isTaskProcessing, setIsTaskProcessing] = useState(false);
  const [currentTask, setCurrentTask] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  return (
    <Card>
      <CardHeader avatar={<Avatar>A</Avatar>} title={app.kind} subheader={application?.group} />
      <CardContent>
        <Typography gutterBottom variant="subtitle1">
          <b>Launch Instance</b>
        </Typography>
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
          color="primary"
          disabled={!project || isTaskProcessing || !name || !version}
          size="small"
          onClick={async () => {
            setIsTaskProcessing(true);
            const response: InstanceId = await mutation.mutateAsync({
              data: {
                application_id: app.application_id,
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
          aria-expanded={expanded}
          aria-label="show instances"
          css={css`
            margin-left: auto;
          `}
          onClick={() => setExpanded(!expanded)}
        >
          <ExpandMoreRoundedIcon />
        </IconButton>
      </CardActions>

      <Collapse unmountOnExit in={expanded} timeout="auto">
        <CardContent>
          <Typography variant="h5">Running Instances</Typography>
          {instances?.length ? (
            instances.map((instance) => (
              <InstanceDetail instance={instance} key={instance.instance_id} />
            ))
          ) : (
            <Typography variant="body2">No Instances Running</Typography>
          )}
        </CardContent>
      </Collapse>
    </Card>
  );
};
