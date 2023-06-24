import type { ChangeEventHandler } from "react";

import { MenuItem, TextField } from "@mui/material";

import { capitalise } from "../utils/app/language";
import type { PermissionLevel } from "./userContext/filter";
import { PERMISSION_LEVELS } from "./userContext/filter";

export interface PermissionLevelSelectProps {
  value: PermissionLevel;
  onChange: ChangeEventHandler<HTMLInputElement>;
}

export const PermissionLevelSelect = ({ value, onChange }: PermissionLevelSelectProps) => {
  return (
    <TextField select label="Version" size="small" value={value} onChange={onChange}>
      {PERMISSION_LEVELS.map((level) => (
        <MenuItem key={level} value={level}>
          {capitalise(level === "none" ? "any" : level)}
        </MenuItem>
      ))}
    </TextField>
  );
};
