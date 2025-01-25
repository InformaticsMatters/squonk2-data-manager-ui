import { useState } from "react";

import { Settings as SettingsIcon } from "@mui/icons-material";
import { Box, IconButton, Tooltip } from "@mui/material";
import dynamic from "next/dynamic";

import { CenterLoader } from "../../components/CenterLoader";
import { ModalWrapper } from "../../components/modals/ModalWrapper";
import { useDMAuthorizationStatus } from "../../hooks/useIsAuthorized";
import { useKeycloakUser } from "../../hooks/useKeycloakUser";
import { MobileNavMenu } from "./MobileNavMenu";
import { NavLinks } from "./NavLinks";
import { OUPContext } from "./OUPContext";
import { UserMenu } from "./UserMenu";

const UserSettingsContent = dynamic(
  () =>
    import("../../features/userSettings/UserSettingsContent/UserSettingsContent").then(
      (mod) => mod.UserSettingsContent,
    ),
  { loading: () => <CenterLoader /> },
);

const SettingsButton = ({ disabled, onClick }: { disabled: boolean; onClick: () => void }) => (
  <Tooltip title="Settings">
    <span>
      <IconButton
        color="inherit"
        disabled={disabled}
        sx={{ ml: { xs: "auto", md: 0 } }}
        onClick={onClick}
      >
        <SettingsIcon />
      </IconButton>
    </span>
  </Tooltip>
);

export const NavBarContents = () => {
  const { user } = useKeycloakUser();
  const isDMAuthorized = useDMAuthorizationStatus();
  const [settingsOpen, setSettingsOpen] = useState(false);

  const handleCloseSettings = () => setSettingsOpen(false);
  const handleOpenSettings = () => setSettingsOpen(true);

  return (
    <>
      <ModalWrapper
        DialogProps={{ fullScreen: true }}
        id="user-settings"
        open={settingsOpen}
        title="Settings"
        onClose={handleCloseSettings}
      >
        {!!user.username && <UserSettingsContent />}
      </ModalWrapper>

      {/* Desktop Navigation */}
      <Box
        sx={{
          display: { xs: "none", md: "block" },
          flex: 1,
        }}
      >
        <NavLinks linkWidth={120} />
      </Box>

      {/* Tablet Navigation */}
      <Box
        sx={{
          display: { xs: "none", md: "none", "@media (min-width:655px)": "block" },
          flex: 1,
        }}
      >
        <NavLinks linkWidth={100} />
      </Box>

      {/* Desktop Controls */}
      <Box
        sx={{
          display: { xs: "none", md: "flex" },
          justifyContent: "flex-end",
          alignItems: "center",
          flex: "1 0",
          minWidth: 0,
          ml: "auto",
        }}
      >
        {!!isDMAuthorized && <OUPContext />}
        <SettingsButton disabled={!isDMAuthorized} onClick={handleOpenSettings} />
        <UserMenu />
      </Box>

      {/* Mobile/Tablet Controls */}
      <Box
        sx={{
          display: { xs: "flex", md: "none" },
          flex: 1,
          justifyContent: "flex-end",
          alignItems: "center",
          ml: { xs: "auto", "@media (min-width:655px)": 0 },
        }}
      >
        <SettingsButton disabled={!isDMAuthorized} onClick={handleOpenSettings} />
        <Box
          sx={{
            display: { "@media (min-width:655px)": "none" },
          }}
        >
          <MobileNavMenu links />
        </Box>
      </Box>
    </>
  );
};
