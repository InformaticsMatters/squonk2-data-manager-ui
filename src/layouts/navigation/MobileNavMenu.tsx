import { useState } from "react";

import { MenuRounded as MenuRoundedIcon } from "@mui/icons-material";
import {
  Box,
  Divider,
  Grid2 as Grid,
  IconButton,
  List,
  ListItemButton,
  ListItemText,
  Typography,
} from "@mui/material";
import A from "next/link";
import { useRouter } from "next/router";

import { ModalWrapper } from "../../components/modals/ModalWrapper";
import { useDMAuthorizationStatus } from "../../hooks/useIsAuthorized";
import { NAV_LINKS, NAV_PARAMS_TO_STRIP, type NavLinkData } from "./navigationConstants";
import { OUPContext } from "./OUPContext";
import { UserMenuContent } from "./UserMenuContent";

/**
 * Mobile modal navigation menu with
 * * Page links
 * * Project management
 * * User menu
 */
export const MobileNavMenu = () => {
  const [open, setOpen] = useState(false);
  const isDMAuthorized = useDMAuthorizationStatus();
  const router = useRouter();

  return (
    <>
      <IconButton color="inherit" size="large" onClick={() => setOpen(true)}>
        <MenuRoundedIcon />
      </IconButton>
      <ModalWrapper id="mobile-menu" open={open} title="" onClose={() => setOpen(false)}>
        <Grid container spacing={2}>
          <Grid
            size={12}
            sx={{ display: { xs: "block" }, "@media (min-width:655px)": { display: "none" } }}
          >
            <Typography component="h3" variant="h6">
              Links
            </Typography>
            <List aria-label="main-mobile-navigation" component="nav">
              {NAV_LINKS.map(({ title, path, text }: NavLinkData) => {
                const active = router.pathname.startsWith(path);
                const query = { ...router.query };
                NAV_PARAMS_TO_STRIP.forEach((param: string) => delete query[param]);
                const href = { query, pathname: path };

                return (
                  <ListItemButton
                    component={A}
                    href={href}
                    key={title}
                    selected={active}
                  >
                    <ListItemText primary={text} />
                  </ListItemButton>
                );
              })}
            </List>
          </Grid>
          <Grid
            size={12}
            sx={{ display: { xs: "block" }, "@media (min-width:655px)": { display: "none" } }}
          >
            <Divider />
          </Grid>
          <Grid size={12}>
            {!!isDMAuthorized && (
              <Box>
                <Typography gutterBottom variant="h3">
                  Project
                </Typography>

                <OUPContext />
              </Box>
            )}
          </Grid>
          <Grid size={12}>
            <UserMenuContent />
          </Grid>
        </Grid>
      </ModalWrapper>
    </>
  );
};
