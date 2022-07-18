import { List, styled } from "@mui/material";

/**
 * Styled MuiList component with a clamped height.
 */
export const ScrollList = styled(List)({
  minHeight: "100px",
  maxHeight: "30vh",
  overflowY: "auto",
});
