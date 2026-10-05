import { type SxProps } from "@mui/material";

/**
 * The Run catalogue's grid of cards. Its skeleton shares it so the cards land exactly where their
 * placeholders stood.
 */
export const cardGridSx: SxProps = {
  display: "grid",
  gap: 2,
  gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
  "@container run-page (max-width: 1100px)": {
    gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
  },
  "@container run-page (max-width: 800px)": {
    gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
  },
};
