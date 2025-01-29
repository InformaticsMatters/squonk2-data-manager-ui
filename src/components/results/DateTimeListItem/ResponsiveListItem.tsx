import { ListItem, ListItemText } from "@mui/material";

export interface ResponsiveListItemProps {
  primary: string;
  secondary?: string;
}

export const ResponsiveListItem = ({ primary, secondary }: ResponsiveListItemProps) => {
  return (
    <ListItem sx={{ ml: { xs: undefined, md: "auto" } }}>
      <ListItemText primary={primary} secondary={secondary} />
    </ListItem>
  );
};
