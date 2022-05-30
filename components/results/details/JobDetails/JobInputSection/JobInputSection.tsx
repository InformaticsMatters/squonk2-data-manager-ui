import type { InstanceSummary } from "@squonk/data-manager-client";

import { FolderRounded, InsertDriveFileRounded } from "@mui/icons-material";
import {
  Alert,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Typography,
} from "@mui/material";

import { getErrorMessage } from "../../../../../utils/orvalError";
import { CenterLoader } from "../../../../CenterLoader";
import { JobLink } from "../JobLink";
import { useGetJobInputs } from "./useGetJobInputs";

export interface JobInputSectionProps {
  /**
   * Instance of the job.
   */
  instanceSummary: InstanceSummary;
}

/**
 * Displays provided inputs for a task.
 */
export const JobInputSection = ({ instanceSummary }: JobInputSectionProps) => {
  const { inputs, isLoading, isError, error } = useGetJobInputs(instanceSummary);

  if (isLoading) {
    return <CenterLoader />;
  }

  if (isError) {
    return <Alert severity="error">{getErrorMessage(error)}</Alert>;
  }

  if (!inputs.length) {
    return <Typography>This job has no inputs</Typography>;
  }

  return (
    <List aria-label="list of job inputs">
      {/* We currently have to assume that the outputs have a consistent type */}
      {inputs.map((input) => {
        return (
          <ListItem key={input.name} sx={{ alignItems: "flex-start" }}>
            <ListItemAvatar>
              <Avatar>
                {input.type === "file" ? <InsertDriveFileRounded /> : <FolderRounded />}
              </Avatar>
            </ListItemAvatar>
            <ListItemText
              disableTypography
              primary={<Typography variant="body1">{input.title}</Typography>}
              secondary={input.value.map((val) => (
                <JobLink
                  key={val}
                  path={val}
                  projectId={instanceSummary.project_id}
                  type={input.type}
                />
              ))}
              sx={{ m: 0 }}
            />
          </ListItem>
        );
      })}
    </List>
  );
};
