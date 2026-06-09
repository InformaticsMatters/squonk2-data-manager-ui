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

// Auth-dependent controls render only on the client. better-auth's
// useSession is client-only, so SSR has no session info while the client
// can resolve it synchronously from the cookie cache — that divergence
// trips MUI's IconButton `disabled || loading` logic and causes a button-
// level hydration mismatch. Skipping SSR for these controls sidesteps the
// issue entirely; users see a brief empty slot before the buttons mount.
const UserMenu = dynamic(() => import("./UserMenu").then((mod) => mod.UserMenu), { ssr: false });

const UserSettingsContent = dynamic(
  () =>
    import("../../features/userSettings/UserSettingsContent/UserSettingsContent").then(
      (mod) => mod.UserSettingsContent,
    ),
  { loading: () => <CenterLoader /> },
);

const SettingsButtonImpl = ({ disabled, onClick }: { disabled: boolean; onClick: () => void }) => (
  <Tooltip title="Settings">
    <span>
      <IconButton
        color="inherit"
        disabled={disabled}
        loading={false}
        sx={{ ml: { xs: "auto", md: 0 } }}
        onClick={onClick}
      >
        <SettingsIcon />
      </IconButton>
    </span>
  </Tooltip>
);

const SettingsButton = dynamic(() => Promise.resolve(SettingsButtonImpl), { ssr: false });

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
        sx={{ display: { xs: "none" }, "@media (min-width:655px)": { display: "block" }, flex: 1 }}
      >
        <NavLinks linkWidth={120} />
      </Box>

      {/* Desktop Controls */}
      <Box
        sx={{
          justifyContent: "flex-end",
          alignItems: "center",
          flex: "1 0",
          minWidth: 0,
          ml: "auto",
          display: "flex",
        }}
      >
        {!!isDMAuthorized && <OUPContext sx={{ display: { xs: "none", md: "flex" } }} />}
        <SettingsButton disabled={!isDMAuthorized} onClick={handleOpenSettings} />

        <Box sx={{ display: { xs: "none", md: "block" } }}>
          <UserMenu />
        </Box>
        <Box sx={{ display: { xs: "block", md: "none" } }}>
          <MobileNavMenu />
        </Box>
      </Box>
    </>
  );
};
