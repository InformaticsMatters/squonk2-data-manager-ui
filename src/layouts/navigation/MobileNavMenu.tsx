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

import { ModalWrapper } from "../../components/modals/ModalWrapper";
import { useDMAuthorizationStatus } from "../../hooks/useIsAuthorized";
import { NavLink } from "./NavLink";
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
              <NavLink stripQueryParameters={["taskId", "instanceId", "path"]} title="Datasets">
                {({ active }) => (
                  <ListItemButton component="a" selected={active}>
                    <ListItemText primary="Datasets" />
                  </ListItemButton>
                )}
              </NavLink>
              <NavLink stripQueryParameters={["taskId", "instanceId", "path"]} title="Project">
                {({ active }) => (
                  <ListItemButton component="a" selected={active}>
                    <ListItemText primary="Project" />
                  </ListItemButton>
                )}
              </NavLink>
              <NavLink stripQueryParameters={["taskId", "instanceId", "path"]} title="Run">
                {({ active }) => (
                  <ListItemButton component="a" selected={active}>
                    <ListItemText primary="Apps/Jobs" />
                  </ListItemButton>
                )}
              </NavLink>
              <NavLink stripQueryParameters={["taskId", "instanceId", "path"]} title="Results">
                {({ active }) => (
                  <ListItemButton component="a" selected={active}>
                    <ListItemText primary="Results" />
                  </ListItemButton>
                )}
              </NavLink>
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
