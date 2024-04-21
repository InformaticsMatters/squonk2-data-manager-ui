import { type InstanceGetResponse, type InstanceSummary } from "@squonk/data-manager-client";

import {
  Alert,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Typography,
} from "@mui/material";

import { FILE_PROTOCOL, removeFileProtocol } from "../../../../utils/app/urls";
import { getErrorMessage } from "../../../../utils/next/orvalError";
import { CenterLoader } from "../../../CenterLoader";
import { InputOutputItemIcon } from "../InputOutputItemIcon";
import { JobLink } from "../JobLink";
import { useGetJobInputs } from "./useGetJobInputs";

export interface JobInputSectionProps {
  /**
   * Instance of the job.
   */
  instance: InstanceGetResponse | InstanceSummary;
}

/**
 * Displays provided inputs for a task.
 */
export const JobInputSection = ({ instance }: JobInputSectionProps) => {
  const { inputs, isLoading, isError, error } = useGetJobInputs(instance);

  if (isLoading) {
    return <CenterLoader />;
  }

  if (isError) {
    return <Alert severity="error">{getErrorMessage(error)}</Alert>;
  }

  if (inputs.length === 0) {
    return <Typography>This job has no inputs</Typography>;
  }

  return (
    <List aria-label="list of job inputs">
      {/* We currently have to assume that the outputs have a consistent type */}
      {inputs.map((input) => {
        const isFile = input.value.map((val) => val.startsWith(FILE_PROTOCOL)).some(Boolean);
        const moleculesType = input.type === "molecules-smi";
        let value = input.value;
        if (moleculesType && isFile) {
          value = value.map((element) => removeFileProtocol(element));
        }
        return (
          <ListItem key={input.name} sx={{ alignItems: "flex-start" }}>
            <ListItemAvatar>
              <Avatar>
                <InputOutputItemIcon type={isFile ? "file" : input.type} />
              </Avatar>
            </ListItemAvatar>
            {moleculesType && !isFile ? (
              <ListItemText
                disableTypography
                primary={<Typography variant="body1">{input.title}</Typography>}
                secondary={value.map((val) => (
                  <>
                    SMILES:{" "}
                    <Typography
                      component="code"
                      key={val}
                      sx={{ fontFamily: "'Fira Mono', monospace" }}
                    >
                      {val.split("\n").join(", ")}
                    </Typography>
                  </>
                ))}
              />
            ) : (
              <ListItemText
                disableTypography
                primary={<Typography variant="body1">{input.title}</Typography>}
                secondary={value.map((val) => (
                  <JobLink
                    isFile={input.type === "file" || isFile}
                    key={val}
                    path={val}
                    projectId={instance.project_id}
                  />
                ))}
                sx={{ m: 0 }}
              />
            )}
          </ListItem>
        );
      })}
    </List>
  );
};
