import AccountTreeRoundedIcon from '@mui/icons-material/AccountTreeRounded';
import { ListItem, ListItemIcon, ListItemText } from '@mui/material';

export interface ProjectListItemProps {
  projectName: string;
}

export const ProjectListItem = ({ projectName }: ProjectListItemProps) => {
  return (
    <ListItem>
      <ListItemIcon sx={{ minWidth: '40px' }}>
        <AccountTreeRoundedIcon />
      </ListItemIcon>
      <ListItemText primary={projectName} />
    </ListItem>
  );
};
