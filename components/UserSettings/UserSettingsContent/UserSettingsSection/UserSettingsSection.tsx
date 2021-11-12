import { List } from '@material-ui/core';

import { DarkModeSwitchListItem } from './DarkModeSwitchListItem';

/**
 * Displays `User Settings` section in User Settings.
 */
export const UserSettingsSection = () => {
  return (
    <List>
      <DarkModeSwitchListItem />
    </List>
  );
};
