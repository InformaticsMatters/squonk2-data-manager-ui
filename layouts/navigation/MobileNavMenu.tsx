import { useState } from "react";

import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import {
  Divider,
  Grid,
  IconButton,
  List,
  ListItemButton,
  ListItemText,
  Typography,
} from "@mui/material";

import { ModalWrapper } from "../../components/modals/ModalWrapper";
import { useIsAuthorized } from "../../hooks/useIsAuthorized";
import { NavLink } from "./NavLink";
import { OUPContext } from "./OUPContext";
import { UserMenuContent } from "./UserMenuContent";

export interface MobileNavMenuProps {
  links?: boolean;
}

/**
 * Mobile modal navigation menu with
 * * Page links
 * * Project management
 * * User menu
 */
export const MobileNavMenu = ({ links = true }: MobileNavMenuProps) => {
  const [open, setOpen] = useState(false);
  const isAuthorized = useIsAuthorized();

  return (
    <>
      <IconButton color="inherit" size="large" onClick={() => setOpen(true)}>
        <MenuRoundedIcon />
      </IconButton>
      <ModalWrapper id="mobile-menu" open={open} title="" onClose={() => setOpen(false)}>
        <Grid container spacing={2}>
          {links && (
            <Grid item xs={12}>
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
                <NavLink stripQueryParameters={["taskId", "instanceId", "path"]} title="Executions">
                  {({ active }) => (
                    <ListItemButton component="a" selected={active}>
                      <ListItemText primary="Executions" />
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
          )}
          {isAuthorized && links && (
            <Grid item xs={12}>
              <Divider />
            </Grid>
          )}
          <Grid item xs={12}>
            {isAuthorized && (
              <>
                <Typography gutterBottom variant="h3">
                  Project
                </Typography>
                <OUPContext />
              </>
            )}
          </Grid>
          <Grid item xs={12}>
            <Divider />
          </Grid>
          <Grid item xs={12}>
            <UserMenuContent />
          </Grid>
        </Grid>
      </ModalWrapper>
    </>
  );
};
