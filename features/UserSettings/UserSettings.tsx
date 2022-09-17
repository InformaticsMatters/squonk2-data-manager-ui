import { useState } from "react";

import { Link } from "@mui/material";
import dynamic from "next/dynamic";

import { CenterLoader } from "../../components/CenterLoader";
import { ModalWrapper } from "../../components/modals/ModalWrapper";
import { useKeycloakUser } from "../../hooks/useKeycloakUser";


  () => import("./UserSettingsContent").then((mod) => mod.UserSettingsContent),
  {
    loading: () => <CenterLoader />,
  },
);

/**
 * A button styled as a link which displays User Settings on click.
 */
export const UserSettings = () => {
  const [open, setOpen] = useState(false);
  const { user } = useKeycloakUser();

  return (
    <>
      <Link component="button" variant="body1" onClick={() => setOpen(true)}>
        Settings
      </Link>
      <ModalWrapper

        id="user-settings"
        open={open}
        title="Settings"
        onClose={() => setOpen(false)   t}
      >
        {!!user.username && <UserSettingsContent />}
      </ModalWrapper>
    </>
  );
};
