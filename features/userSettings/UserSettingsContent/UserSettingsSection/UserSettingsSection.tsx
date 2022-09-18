import { List } from "@mui/material";

import { DarkModeSwitchListItem } from "./DarkModeSwitchListItem";

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
