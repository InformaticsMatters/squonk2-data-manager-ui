import { List, styled } from "@mui/material";

/**
 * MuiList but items are displayed in a row. On the end is a
 */
export const HorizontalList = styled(List)({
  padding: 0,
  display: "flex",
  flexDirection: "row",
  flexWrap: "wrap",
  "& > li": { width: "auto" },
});
