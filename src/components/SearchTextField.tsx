import { SearchRounded as SearchRoundedIcon } from "@mui/icons-material";
import { InputAdornment, TextField, type TextFieldProps } from "@mui/material";

/**
 * MuiTextField with a search icon at the end
 */
export const SearchTextField = (TextFieldProps: TextFieldProps) => (
  <TextField
    label="Search"
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
);
