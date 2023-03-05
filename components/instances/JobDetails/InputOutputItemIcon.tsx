import {
  FilterNoneRounded,
  FolderRounded,
  InsertDriveFileRounded,
  ScienceRounded,
} from "@mui/icons-material";
import { Avatar } from "@mui/material";

import type { InputFieldSchema } from "../../executionsCards/JobCard/JobInputFields";

export interface InputOutputItemIconProps {
  type: InputFieldSchema["type"];
}

export const InputOutputItemIcon = ({ type }: InputOutputItemIconProps) => {
  switch (type) {
    case "directory":
      return (
        <Avatar>
          <FolderRounded />
        </Avatar>
      );
    case "file":
      return (
        <Avatar>
          <InsertDriveFileRounded />
        </Avatar>
      );
    case "molecule":
      return (
        <Avatar>
          <ScienceRounded />
        </Avatar>
      );
    case "molecules":
      return (
        <Avatar>
          <ScienceRounded />
        </Avatar>
      );
    default:
      return (
        <Avatar>
          <FilterNoneRounded />
        </Avatar>
      );
  }
};
