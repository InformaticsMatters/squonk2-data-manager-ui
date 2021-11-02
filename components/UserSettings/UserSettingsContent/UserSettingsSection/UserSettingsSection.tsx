import { List, Typography } from '@material-ui/core';

import { DarkModeSwitchListItem } from './DarkModeSwitchListItem';

/**
 * Displays `User Settings` section in User Settings.
 */
export const UserSettingsSection = () => {
  return (
    <>
      <Typography gutterBottom component="h3" variant="h2">
        User Settings
      </Typography>
      <List>
        <DarkModeSwitchListItem />
      </List>
    </>
  );
};
