import { type InstanceGetResponse, type InstanceSummary } from "@/api/data-manager";

import { List, ListItem, ListItemAvatar, ListItemText, Typography } from "@mui/material";

import { resultInstanceOutputs } from "../../../projects/instanceFacts";
import { InputOutputItemIcon } from "./InputOutputItemIcon";
import { JobLink } from "./JobLink";

export interface JobOutputSectionProps {
  /**
   * Instance of the job.
   */
  instance: InstanceGetResponse | InstanceSummary;
}

/**
 * Displays generated outputs for a task. A job accounts for its outputs through the definition it
 * rendered at launch, so the outputs shown are whichever of the instance's own two declarations
 * accounts for it.
 */
export const JobOutputSection = ({ instance }: JobOutputSectionProps) => {
  const outputs = resultInstanceOutputs(instance);

  if (outputs.length === 0) {
    return <Typography>This job has no outputs</Typography>;
  }

  return (
    <List aria-label="list of job outputs">
      {outputs.map((output) => (
        <ListItem key={output.name} sx={{ alignItems: "flex-start" }}>
          <ListItemAvatar>
            <InputOutputItemIcon type={output.kind} />
          </ListItemAvatar>
          <ListItemText
            disableTypography
            primary={<Typography variant="body1">{output.title}</Typography>}
            secondary={
              <JobLink
                isFile={output.kind === "file"}
                path={output.creates}
                projectId={instance.project_id}
              />
            }
            sx={{ m: 0 }}
          />
        </ListItem>
      ))}
    </List>
  );
};
