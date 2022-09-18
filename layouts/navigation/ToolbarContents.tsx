import { useState } from "react";

import { styled, useMediaQuery, useTheme } from "@mui/material";
import dynamic from "next/dynamic";

import { CenterLoader } from "../../components/CenterLoader";
import { ModalWrapper } from "../../components/modals/ModalWrapper";
import { useIsAuthorized } from "../../hooks/useIsAuthorized";
import { useKeycloakUser } from "../../hooks/useKeycloakUser";
import { MobileNavMenu } from "./MobileNavMenu";
import { NavLinks } from "./NavLinks";
import { OUPContext } from "./OUPContext";
import { UserMenu } from "./UserMenu";

const UserSettingsContent = dynamic(
  () =>
    import("../../features/UserSettings/UserSettingsContent/UserSettingsContent").then(
      (mod) => mod.UserSettingsContent,
    ),
  {
    loading: () => <CenterLoader />,
  },
);

/**
 * Desktop / Tablet toolbar contents
 */
export const ToolbarContents = () => {
  const theme = useTheme();
  const { user } = useKeycloakUser();

  // Custom breakpoint to match width of nav links text
  const biggerThanSm = useMediaQuery("@media (min-width:655px)");
  const biggerThanMd = useMediaQuery(theme.breakpoints.up("md"));
  const isAuthorized = useIsAuthorized();

  const [settingsOpen, setSettingsOpen] = useState(false);

  const props = {
    closeSettings: () => setSettingsOpen(false),
    open: settingsOpen,
    openSettings: () => setSettingsOpen(true),
  };

  let navContent;
  if (biggerThanMd) {
    // Desktop
    navContent = (
      <>
        <NavLinks linkWidth={120} />
        <IconsWrapper>
          {isAuthorized && <OUPContext />}
          <UserMenu {...props} />
        </IconsWrapper>
      </>
    );
  } else if (biggerThanSm) {
    // Tablet
    navContent = (
      <>
        <NavLinks linkWidth={100} />
        <IconsWrapper>
          <MobileNavMenu {...props} />
        </IconsWrapper>
      </>
    );
  } else {
    navContent = <MobileNavMenu {...props} />;
  }

  return (
    <>
      <ModalWrapper
        DialogProps={{ fullScreen: true }}
        id="user-settings"
        open={settingsOpen}
        title="Settings"
        onClose={props.closeSettings}
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
