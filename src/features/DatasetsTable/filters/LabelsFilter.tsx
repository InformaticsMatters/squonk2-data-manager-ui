import { useState } from "react";

import { AddCircle } from "@mui/icons-material";
import { Chip, IconButton, styled, TextField, useTheme } from "@mui/material";

export interface LabelsFilterProps {
  /**
   * Current labels as string (what user typed).
   */
  labels?: string[];
  /**
   * Function to set labels.
   */
  setLabels: (label?: string[]) => void;
}

/**
 * Component which adjusts filtering of datasets according to label. Labels can be added either via
 * the Add button which appears after providing text or by hitting the Enter key on a keyboard.
 */
export const LabelsFilter = ({ labels, setLabels }: LabelsFilterProps) => {
  const theme = useTheme();

  const [currentLabel, setCurrentLabel] = useState("");

  // Used to tidy up the code in the `addLabel` and `removeLabel` methods
  const labelsArray = labels ?? [];

  const addLabel = () => {
    if (currentLabel) {
      const newLabels = [...labelsArray, currentLabel];
      setLabels(newLabels);
      setCurrentLabel("");
    }
  };

  const removeLabel = (index: number) => {
    const newLabels = [...labelsArray];
    newLabels.splice(index, 1);
    setLabels(newLabels.length > 0 ? newLabels : undefined);
  };

  const addLabelWithKeyboard = (key: string) => {
    if (key === "Enter") {
      addLabel();
    }
  };

  return (
    <TextField
      id="datasets-labels-filter"
      label="Filter by label"
      slotProps={{
        input: {
          style: { flexWrap: "wrap", gap: `0 ${theme.spacing(1 / 2)}` },
          startAdornment: labels?.map((label, index) => (
            <Chip
              // eslint-disable-next-line react/no-array-index-key
              key={index}
              label={label}
              size="small"
              sx={{ mt: "6px" }}
              variant="outlined"
              onDelete={() => removeLabel(index)}
            />
          )),
          endAdornment: (
            <EndAdornmentWrapper visibility={!!currentLabel}>
              <IconButton
                aria-label="Add label"
                // MUI Autocomplete uses 4px padding for the buttons, keep it consistent
                size="small"
                sx={{ p: "4px" }}
                title="Add label"
                onClick={() => addLabel()}
              >
                <AddCircle />
              </IconButton>
            </EndAdornmentWrapper>
          ),
        },

        htmlInput: {
          autoComplete: "off", // Disable autocomplete and autofill
          style: { flexBasis: "calc(100% - 30px)" },
        },
      }}
      sx={{ width: "100%", flexBasis: "100%" }}
      value={currentLabel}
      variant="outlined"
      onChange={(event) => setCurrentLabel(event.target.value)}
      onKeyUp={(event) => addLabelWithKeyboard(event.key)}
    />
  );
};

// MUI Autocomplete implements the end adornment similarly using position: absolute.
// This way, the Add button is always on the same bottom line as the input text
const EndAdornmentWrapper = styled("div", { shouldForwardProp: (prop) => prop !== "visibility" })<{
  visibility: boolean;
}>(({ visibility }) => ({
  visibility: visibility ? undefined : "hidden",
  position: "absolute",
  right: "9px",
  bottom: "7px",
}));
