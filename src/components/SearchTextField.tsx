import { forwardRef } from "react";

import { SearchRounded as SearchRoundedIcon } from "@mui/icons-material";
import { InputAdornment, TextField, type TextFieldProps } from "@mui/material";

import { getSearchShortcut } from "../utils/platform";

/**
 * MuiTextField with a search icon at the end and platform-specific keyboard shortcut in label
 */
export const SearchTextField = forwardRef<HTMLDivElement, TextFieldProps>(
  (TextFieldProps, ref) => (
    <TextField
      label={`Search (${getSearchShortcut()})`}
      ref={ref}
      {...TextFieldProps}
      slotProps={{
        input: {
          endAdornment: (
            <InputAdornment position="end">
              <SearchRoundedIcon />
            </InputAdornment>
          ),
        },
      }}
    />
  ),
);

SearchTextField.displayName = "SearchTextField";
