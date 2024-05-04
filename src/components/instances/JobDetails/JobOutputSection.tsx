import { type InstanceGetResponse, type InstanceSummary } from "@squonk/data-manager-client";

import { List, ListItem, ListItemAvatar, ListItemText, Typography } from "@mui/material";

import { InputOutputItemIcon } from "./InputOutputItemIcon";
import { JobLink } from "./JobLink";
import { type OutputValue } from "./types";

export interface JobOutputSectionProps {
  /**
   * Instance of the job.
   */
  instance: InstanceGetResponse | InstanceSummary;
}

/**
 * Displays generated outputs for a task.
 */
export const JobOutputSection = ({ instance }: JobOutputSectionProps) => {
  const outputs: Record<string, OutputValue> = instance.outputs ? JSON.parse(instance.outputs) : {};
  const outputsEntries = Object.entries(outputs);

  if (outputsEntries.length === 0) {
    return <Typography>This job has no outputs</Typography>;
  }

  return (
    <List aria-label="list of job outputs">
      {/* We currently have to assume that the outputs have a consistent type */}
      {outputsEntries.map(([name, output]) => {
        const isFile = output.type === "file" || output.type === "files";

        return (
          <ListItem key={name} sx={{ alignItems: "flex-start" }}>
            <ListItemAvatar>
              <InputOutputItemIcon type={isFile ? "file" : "directory"} />
            </ListItemAvatar>
            <ListItemText
              disableTypography
              primary={<Typography variant="body1">{output.title}</Typography>}
              secondary={
                <JobLink
                  isFile={output.type === "file" || output.type === "files"}
                  path={output.creates}
                  projectId={instance.project_id}
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
