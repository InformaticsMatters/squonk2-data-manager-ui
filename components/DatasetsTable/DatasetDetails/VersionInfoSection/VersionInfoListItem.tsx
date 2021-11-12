import { ListItem, ListItemText } from '@material-ui/core';

export interface VersionInfoListItemProps {
  /**
   * Name of the information displayed on the left side.
   */
  name: string;
  /**
   * Value of the information displayed on the right side.
   */
  value?: string | number;
}

/**
 * Component which displays information about a specific dataset version.
 */
export const VersionInfoListItem = ({ name, value }: VersionInfoListItemProps) => {
  return (
    <ListItem>
      <ListItemText primary={name} />
      <ListItemText
        primary={value}
        primaryTypographyProps={{
          align: 'right',
        }}
      />
    </ListItem>
  );
};
