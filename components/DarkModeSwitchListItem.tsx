import { Box, Switch } from "@mui/material";

import { useColorScheme } from "../state/colorScheme";

/**
 * Displays a button which controls the theme of the application.
 */
export const DarkModeSwitchListItem = () => {
  const [scheme, setScheme] = useColorScheme();

  return (
    <Box alignItems="center" display="flex">
      Dark Mode
      <Switch
        checked={scheme === "dark"}
        inputProps={{ "aria-label": "color-scheme-toggle" }}
        onChange={(event) => setScheme(event.target.checked ? "dark" : "light")}
      />
    </Box>
  );
};
