import type { TextFieldProps } from '@material-ui/core';
import { InputAdornment, TextField } from '@material-ui/core';
import SearchRoundedIcon from '@material-ui/icons/SearchRounded';

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
