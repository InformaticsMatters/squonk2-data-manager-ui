import { Box, Checkbox, FormControlLabel, Typography } from "@mui/material";

export type DebugValue = "0" | "debug";

export interface DebugCheckboxProps {
  value: DebugValue;
  onChange: (value: DebugValue) => void;
}

export const DebugCheckbox = ({ value, onChange }: DebugCheckboxProps) => {
  return (
    <Box sx={{ marginX: 1 }}>
      <FormControlLabel
        control={
          <Checkbox
            checked={value !== "0"}
            onChange={(_event, checked) => onChange(checked ? "debug" : "0")}
          />
        }
        label="Debug"
      />
      <Typography gutterBottom variant="body2">
        Enabling this allows an admin to inspect the instance fully once it finishes.
      </Typography>
    </Box>
  );
};
