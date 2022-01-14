import { css } from '@emotion/react';
import { ListItem, ListItemIcon, ListItemText } from '@material-ui/core';
import AccountTreeRoundedIcon from '@material-ui/icons/AccountTreeRounded';

export interface ProjectListItemProps {
  projectName: string;
}

export const ProjectListItem = ({ projectName }: ProjectListItemProps) => {
  return (
    <ListItem>
      <ListItemIcon
        css={css`
          min-width: 40px;
        `}
      >
        <AccountTreeRoundedIcon />
      </ListItemIcon>
      <ListItemText primary={projectName} />
    </ListItem>
  );
};
