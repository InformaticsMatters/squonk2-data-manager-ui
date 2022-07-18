import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import type { TextFieldProps } from "@mui/material";
import { InputAdornment, TextField } from "@mui/material";

/**
 * MuiTextField with a search icon at the end
 */
export const SearchTextField = (TextFieldProps: TextFieldProps) => (
  <TextField
    label="Search"
    {...TextFieldProps}
    InputProps={{
      endAdornment: (
        <InputAdornment position="end">
          <SearchRoundedIcon />
        </InputAdornment>
      ),
    }}
  />
);
