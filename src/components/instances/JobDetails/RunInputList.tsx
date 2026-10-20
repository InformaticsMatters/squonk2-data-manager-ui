import { Fragment } from "react";

import { Avatar, List, ListItem, ListItemAvatar, ListItemText, Typography } from "@mui/material";

import { firaMonoFont } from "../../../constants/fonts";
import { type SuppliedRunInput } from "../../../projects/runLaunchForm";
import { FILE_PROTOCOL, removeFileProtocol } from "../../../utils/app/urls";
import { InputOutputItemIcon } from "./InputOutputItemIcon";
import { JobLink } from "./JobLink";

export interface RunInputListProps {
  /** The inputs the run was given. */
  inputs: SuppliedRunInput[];
  /** The project that owns the run; every link is addressed inside it. */
  projectId: string;
  /** What the run is called where it is named, such as "job" or "workflow". */
  noun: string;
}

/**
 * The inputs one run was given, each linked to where it lives in the project that owns the run. A
 * job and a workflow are given inputs the same way, so both present them through this one list.
 */
export const RunInputList = ({ inputs, projectId, noun }: RunInputListProps) => {
  if (inputs.length === 0) {
    return <Typography>This {noun} has no inputs</Typography>;
  }

  return (
    <List aria-label={`list of ${noun} inputs`}>
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
                  <Fragment key={val}>
                    SMILES:{" "}
                    <Typography className={firaMonoFont.className} component="code">
                      {val.split("\n").join(", ")}
                    </Typography>
                  </Fragment>
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
                    projectId={projectId}
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
