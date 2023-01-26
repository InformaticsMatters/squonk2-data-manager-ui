import { useState } from "react";

import type { OrganisationDetail } from "@squonk/account-server-client";

import { Edit as EditIcon } from "@mui/icons-material";
import { ListItemButton, ListItemIcon, ListItemText, Typography } from "@mui/material";

import { ModalWrapper } from "../../../../../components/modals/ModalWrapper";
import { OrganisationEditors } from "./OrganisationEditors";

export interface EditOrganisationListItemProps {
  organisation: OrganisationDetail;
}

export const EditOrganisationListItem = ({ organisation }: EditOrganisationListItemProps) => {
  const [open, setOpen] = useState(false);
  return (
    <>
      <ListItemButton onClick={() => setOpen((open) => !open)}>
        <ListItemText primary="Edit Organisation" secondary="Add and remove organisation editors" />
        <ListItemIcon>
          <EditIcon color="action" />
        </ListItemIcon>
      </ListItemButton>
      <ModalWrapper
        DialogProps={{ maxWidth: "sm", fullWidth: true }}
        id={`edit-organisation-${organisation.id}`}
        open={open}
        title="Edit Organisation"
        onClose={() => setOpen(false)}
      >
        <Typography gutterBottom variant="h3">
          Editors
        </Typography>
        <OrganisationEditors organisation={organisation} />
      </ModalWrapper>
    </>
  );
};
