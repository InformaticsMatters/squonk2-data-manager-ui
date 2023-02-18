import { ListItem, ListItemText, useMediaQuery, useTheme } from "@mui/material";

export interface ResponsiveListItemProps {
  primary: string;
  secondary?: string;
}

export const ResponsiveListItem = ({ primary, secondary }: ResponsiveListItemProps) => {
  const theme = useTheme();
  const biggerThanMd = useMediaQuery(theme.breakpoints.up("md"));
  return (
    <ListItem sx={{ ml: biggerThanMd ? "auto" : undefined }}>
      <ListItemText primary={primary} secondary={secondary} />
    </ListItem>
  );
};
