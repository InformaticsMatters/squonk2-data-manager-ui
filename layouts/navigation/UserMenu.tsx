import AccountCircle from "@mui/icons-material/AccountCircle";
import { Box, Fade, IconButton, Paper, Popper, Tooltip } from "@mui/material";
import { bindPopper, bindToggle, usePopupState } from "material-ui-popup-state/hooks";

import { useKeycloakUser } from "../../hooks/useKeycloakUser";
import type { SettingsControls } from "./ToolbarContents";
import { UserMenuContent } from "./UserMenuContent";

/**
 * Popover displaying the user menu options
 */
export const UserMenu = (props: SettingsControls) => {
  const popupState = usePopupState({ variant: "popper", popupId: "user-menu" });
  const { isLoading } = useKeycloakUser();

  return (
    <>
      <Tooltip title="User">
        <span>
          <IconButton
            color="inherit"
            disabled={isLoading}
            edge="end"
            {...bindToggle(popupState)}
            size="large"
          >
            <AccountCircle />
          </IconButton>
        </span>
      </Tooltip>

      <Popper
        transition
        placement="bottom-start"
        sx={{ "& .MuiPopover-paper": { p: 1 } }}
        {...bindPopper(popupState)}
        // anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        // transformOrigin={{ vertical: "top", horizontal: "left" }}
      >
        {({ TransitionProps }) => (
          <Fade {...TransitionProps} timeout={350}>
            <Paper>
              <Box p={1}>
                <UserMenuContent closeOpener={popupState.close} {...props} />
              </Box>
            </Paper>
          </Fade>
        )}
      </Popper>
    </>
  );
};
