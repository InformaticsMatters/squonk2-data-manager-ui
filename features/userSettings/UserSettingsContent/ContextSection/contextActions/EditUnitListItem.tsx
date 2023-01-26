import { useState } from "react";

import type { UnitDetail } from "@squonk/account-server-client";

import { Edit as EditIcon } from "@mui/icons-material";
import { ListItemButton, ListItemIcon, ListItemText, Typography } from "@mui/material";

import { ModalWrapper } from "../../../../../components/modals/ModalWrapper";
import { UnitEditors } from "./UnitEditors";

export interface EditUnitListItemProps {
  unit: UnitDetail;
}

export const EditUnitListItem = ({ unit }: EditUnitListItemProps) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <ListItemButton onClick={() => setOpen((open) => !open)}>
        <ListItemText primary="Edit Unit" secondary="Add and remove unit editors" />
        <ListItemIcon>
          <EditIcon color="action" />
        </ListItemIcon>
      </ListItemButton>
      <ModalWrapper
        DialogProps={{ maxWidth: "sm", fullWidth: true }}
        id={`edit-unit-${unit.id}`}
        open={open}
        title="Edit Unit"
        onClose={() => setOpen(false)}
      >
        <Typography gutterBottom variant="h3">
          Editors
        </Typography>
        <UnitEditors unit={unit} />
      </ModalWrapper>
    </>
  );
};
