import { useState } from "react";

import { Settings as SettingsIcon } from "@mui/icons-material";
import { Box, IconButton, styled, Tooltip, useMediaQuery, useTheme } from "@mui/material";
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
  {
    loading: () => <CenterLoader />,
  },
);

export interface SettingsControls {
  closeSettings: () => void;
  open: boolean;
  openSettings: () => void;
}

export const NavBarContents = () => {
  const theme = useTheme();
  const { user } = useKeycloakUser();

  // Custom breakpoint to match width of nav links text
  const biggerThanSm = useMediaQuery("@media (min-width:655px)");
  const biggerThanMd = useMediaQuery(theme.breakpoints.up("md"));
  const isDMAuthorized = useDMAuthorizationStatus();

  const [settingsOpen, setSettingsOpen] = useState(false);

  const props: SettingsControls = {
    closeSettings: () => setSettingsOpen(false),
    open: settingsOpen,
    openSettings: () => setSettingsOpen(true),
  };

  const settingsButton = (
    <Tooltip title="Settings">
      <span>
        <IconButton
          color="inherit"
          disabled={!isDMAuthorized}
          sx={{ ml: biggerThanMd ? 0 : "auto" }}
          onClick={() => {
            props.openSettings();
          }}
        >
          <SettingsIcon />
        </IconButton>
      </span>
    </Tooltip>
  );

  const navContent = biggerThanMd ? (
    <>
      {/* Desktop */}
      <NavLinks linkWidth={120} />
      <IconsWrapper>
        {!!isDMAuthorized && <OUPContext />}
        {settingsButton}
        <UserMenu />
      </IconsWrapper>
    </>
  ) : (
    <>
      {/* Tablet / Mobile */}
      {!!biggerThanSm && <NavLinks linkWidth={100} />}
      <Box sx={{ marginLeft: biggerThanSm ? undefined : "auto" }}>{settingsButton}</Box>
      <MobileNavMenu links={!biggerThanSm} />
    </>
  );

  return (
    <>
      <ModalWrapper
        DialogProps={{ fullScreen: true }}
        id="user-settings"
        open={settingsOpen}
        title="Settings"
        onClose={() => props.closeSettings()}
      >
        {!!user.username && <UserSettingsContent />}
      </ModalWrapper>
      {navContent}
    </>
  );
};

const IconsWrapper = styled("div")({
  display: "flex",
  justifyContent: "flex-end",
  alignItems: "center",
  flex: "1 0",
  minWidth: 0,
});
