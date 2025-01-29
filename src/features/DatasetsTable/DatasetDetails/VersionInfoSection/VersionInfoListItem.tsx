import { ListItem, ListItemText } from "@mui/material";

export interface VersionInfoListItemProps {
  /**
   * Name of the information displayed on the left side.
   */
  name: string;
  /**
   * Value of the information displayed on the right side.
   */
  value?: number | string;
}

/**
 * Component which displays information about a specific dataset version.
 */
export const VersionInfoListItem = ({ name, value }: VersionInfoListItemProps) => {
  return (
    <ListItem>
      <ListItemText primary={name} />
      <ListItemText primary={value} slotProps={{ primary: { align: "right" } }} />
    </ListItem>
  );
};
