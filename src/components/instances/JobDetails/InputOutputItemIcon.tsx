import { Avatar } from "@mui/material";

import { type InputFieldSchema } from "../../../projects/runLaunchForm";
import { DirectoryIcon, FileIcon, MoleculeIcon, ValueIcon } from "../../icons";

export interface InputOutputItemIconProps {
  type: InputFieldSchema["type"];
}

export const InputOutputItemIcon = ({ type }: InputOutputItemIconProps) => {
  switch (type) {
    case "directory":
      return (
        <Avatar>
          <DirectoryIcon />
        </Avatar>
      );
    case "file":
      return (
        <Avatar>
          <FileIcon />
        </Avatar>
      );
    case "molecules-smi":
      return (
        <Avatar>
          <MoleculeIcon />
        </Avatar>
      );
    default:
      return (
        <Avatar>
          <ValueIcon />
        </Avatar>
      );
  }
};
