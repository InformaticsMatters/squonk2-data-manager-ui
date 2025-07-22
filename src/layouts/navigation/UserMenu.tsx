import { AccountCircle as AccountCircleIcon } from "@mui/icons-material";
import { Badge, Box, Fade, IconButton, Paper, Popper, Tooltip } from "@mui/material";
import { bindPopper, bindToggle, usePopupState } from "material-ui-popup-state/hooks";

import { useKeycloakUser } from "../../hooks/useKeycloakUser";
import { useUnreadEventCount } from "../../state/notifications";
import { UserMenuContent } from "./UserMenuContent";

/**
 * Popover displaying the user menu options
 */
export const UserMenu = () => {
  const popupState = usePopupState({ variant: "popper", popupId: "user-menu" });
  const { isLoading } = useKeycloakUser();
  const { count, resetCount } = useUnreadEventCount();

  // Reset count when menu is opened
  const handleToggle = bindToggle(popupState);
  const handleMenuToggle = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (!popupState.isOpen) {
      resetCount();
    }
    handleToggle.onClick(event);
  };

  return (
    <>
      <Tooltip title="Account">
        <span>
          <Badge badgeContent={count} color="success" max={99}>
            <IconButton
              color="inherit"
              disabled={isLoading}
              edge="end"
              size="large"
              onClick={handleMenuToggle}
            >
              <AccountCircleIcon />
            </IconButton>
          </Badge>
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
              <Box sx={{ p: 1 }}>
                <UserMenuContent />
              </Box>
            </Paper>
          </Fade>
        )}
      </Popper>
    </>
  );
};
