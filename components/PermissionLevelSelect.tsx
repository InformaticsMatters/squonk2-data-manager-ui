import { type ChangeEventHandler } from "react";

import { MenuItem, TextField } from "@mui/material";

import { capitalise } from "../utils/app/language";
import { PERMISSION_LEVELS, type PermissionLevel } from "./userContext/filter";

export interface PermissionLevelSelectProps {
  value: PermissionLevel;
  onChange: ChangeEventHandler<HTMLInputElement>;
}

export const PermissionLevelSelect = ({ value, onChange }: PermissionLevelSelectProps) => {
  return (
    <TextField select label="Role" size="small" value={value} onChange={onChange}>
      {PERMISSION_LEVELS.map((level) => (
        <MenuItem key={level} value={level}>
          {capitalise(level === "none" ? "any" : level)}
        </MenuItem>
      ))}
    </TextField>
  );
};
