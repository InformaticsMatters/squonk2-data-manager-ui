import { List, ListItem, ListItemAvatar, ListItemText, Typography } from "@mui/material";

import { type ResultInstanceOutput } from "../../../projects/instanceFacts";
import { InputOutputItemIcon } from "./InputOutputItemIcon";
import { JobLink } from "./JobLink";

export interface RunOutputListProps {
  /** The outputs the run declared. */
  outputs: ResultInstanceOutput[];
  /** The project that owns the run; every link is addressed inside it. */
  projectId: string;
  /** What the run is called where it is named, such as "job" or "workflow". */
  noun: string;
}

/**
 * The outputs one run declared, each linked to where it was written in the project that owns the
 * run. A job and a workflow declare outputs the same way, so both present them through this list.
 */
export const RunOutputList = ({ outputs, projectId, noun }: RunOutputListProps) => {
  if (outputs.length === 0) {
    return <Typography>This {noun} has no outputs</Typography>;
  }

  return (
    <List aria-label={`list of ${noun} outputs`}>
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
                projectId={projectId}
              />
            }
            sx={{ m: 0 }}
          />
        </ListItem>
      ))}
    </List>
  );
};
