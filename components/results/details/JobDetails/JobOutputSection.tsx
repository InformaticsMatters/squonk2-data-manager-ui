import type { InstanceSummary } from '@squonk/data-manager-client';

import { FolderRounded, InsertDriveFileRounded } from '@mui/icons-material';
import { Avatar, List, ListItem, ListItemAvatar, ListItemText, Typography } from '@mui/material';

import { JobLink } from './JobLink';
import type { OutputValue } from './types';

export interface JobOutputSectionProps {
  /**
   * Instance of the job.
   */
  instanceSummary: InstanceSummary;
}

/**
 * Displays generated outputs for a task.
 */
export const JobOutputSection = ({ instanceSummary }: JobOutputSectionProps) => {
  const outputs: Record<string, OutputValue> = instanceSummary.outputs
    ? JSON.parse(instanceSummary.outputs)
    : {};
  const outputsEntries = Object.entries(outputs);

  if (!outputsEntries.length) {
    return <Typography>This job has no outputs</Typography>;
  }

  return (
    <List aria-label="list of job outputs">
      {/* We currently have to assume that the outputs have a consistent type */}
      {outputsEntries.map(([name, output]) => {
        const isFile = output.type === 'file' || output.type === 'files';

        return (
          <ListItem key={name} sx={{ alignItems: 'flex-start' }}>
            <ListItemAvatar>
              <Avatar>{isFile ? <InsertDriveFileRounded /> : <FolderRounded />}</Avatar>
            </ListItemAvatar>
            <ListItemText
              disableTypography
              primary={<Typography variant="body1">{output.title}</Typography>}
              secondary={
                <JobLink
                  path={output.creates}
                  projectId={instanceSummary.project_id}
                  type={output.type}
                />
              }
              sx={{ m: 0 }}
            />
          </ListItem>
        );
      })}
    </List>
  );
};
