import AccountCircle from "@mui/icons-material/AccountCircle";
import { IconButton, Popover, Tooltip } from "@mui/material";
import { bindPopover, bindTrigger, usePopupState } from "material-ui-popup-state/hooks";

import { useKeycloakUser } from "../../hooks/useKeycloakUser";
import { UserMenuContent } from "./UserMenuContent";

/**
 * Popover displaying the user menu options
 */
export const UserMenu = () => {
  const popupState = usePopupState({ variant: "popover", popupId: "user-menu" });

  const { isLoading } = useKeycloakUser();

  return (
    <>
      <Tooltip title="User">
        <span>
          <IconButton
            color="inherit"
            disabled={isLoading}
            edge="end"
            {...bindTrigger(popupState)}
            size="large"
          >
            <AccountCircle />
          </IconButton>
        </span>
      </Tooltip>

      <Popover
        sx={{ "& .MuiPopover-paper": { p: 1 } }}
        {...bindPopover(popupState)}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        transformOrigin={{ vertical: "top", horizontal: "left" }}
      >
        <UserMenuContent />
      </Popover>
    </>
  );
};
