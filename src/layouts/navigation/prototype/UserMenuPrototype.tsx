// PROTOTYPE — throwaway.
//
// Question: what should the top-nav user menu be, given that Popper (never closes on an outside
// click) and Popover (swallows the outside click) are both out?
//
// Four variants of the user menu, switchable via `?userMenu=` on any page, rendered in the real
// nav bar so they are judged against real density and real page content.
import { useEffect } from "react";

import { AccountCircle as AccountCircleIcon } from "@mui/icons-material";
import { Badge, Box, IconButton, Tooltip } from "@mui/material";

import { useKeycloakUser } from "../../../hooks/useKeycloakUser";
import { useUnreadEventCount } from "../../../state/notifications";
import { UserMenu as CurrentUserMenu } from "../UserMenu";
import { usePrototypeVariant } from "./PrototypeSwitcher";
import { useUserMenuOpen } from "./shared";
import { VariantMenuList } from "./VariantMenuList";
import { VariantSectioned } from "./VariantSectioned";
import { VariantStatusFirst } from "./VariantStatusFirst";
import { VariantTwoColumn } from "./VariantTwoColumn";

const MenuButton = () => {
  const [open, setOpen] = useUserMenuOpen();
  const { isLoading } = useKeycloakUser();
  const { count, resetCount } = useUnreadEventCount();

  return (
    <Tooltip title={open ? "" : "Account"}>
      <span>
        <Badge badgeContent={count} color="success" max={99}>
          <IconButton
            color="inherit"
            disabled={isLoading}
            edge="end"
            loading={false}
            size="large"
            onClick={() => {
              if (!open) {
                resetCount();
              }
              setOpen(!open);
            }}
          >
            <AccountCircleIcon />
          </IconButton>
        </Badge>
      </span>
    </Tooltip>
  );
};

/** Goes where the production `UserMenu` goes, inside the toolbar. */
export const UserMenuPrototype = () => {
  const variant = usePrototypeVariant();
  const [, setOpen] = useUserMenuOpen();

  useEffect(() => {
    setOpen(false);
  }, [variant, setOpen]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [setOpen]);

  if (variant === "current") {
    return <CurrentUserMenu />;
  }

  return (
    <Box sx={{ position: "relative", display: "flex" }}>
      <MenuButton />
      {variant === "list" && <VariantMenuList />}
      {variant === "columns" && <VariantTwoColumn />}
      {variant === "sections" && <VariantSectioned />}
      {variant === "status" && <VariantStatusFirst />}
    </Box>
  );
};
