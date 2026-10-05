import { forwardRef } from "react";

import { InputAdornment, TextField, type TextFieldProps } from "@mui/material";

import { useClientSnapshot } from "../hooks/useClientSnapshot";
import { getSearchShortcut } from "../utils/platform";
import { SearchIcon } from "./icons";

/**
 * MuiTextField with a search icon at the end and platform-specific keyboard shortcut in label. The
 * platform is the browser's to answer, so a server render, and the hydration that must agree with
 * it, name the shortcut most platforms use.
 */
export const SearchTextField = forwardRef<HTMLDivElement, TextFieldProps>((TextFieldProps, ref) => (
  <TextField
    label={`Search (${useClientSnapshot(getSearchShortcut, "Ctrl+F")})`}
    ref={ref}
    {...TextFieldProps}
    slotProps={{
      input: {
        endAdornment: (
          <InputAdornment position="end">
            <SearchIcon />
          </InputAdornment>
        ),
      },
    }}
  />
));

SearchTextField.displayName = "SearchTextField";
