import { useState } from "react";

import type { UnitDetail } from "@squonk/account-server-client";

import { Edit as EditIcon } from "@mui/icons-material";
import { Box, ListItemButton, ListItemIcon, ListItemText, Typography } from "@mui/material";

import { ModalWrapper } from "../../../../../components/modals/ModalWrapper";
import { EditUnit } from "../../../../../components/units/EditUnit";
import { UnitEditors } from "../../../../../components/units/UnitEditors";

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
        <Box display="flex" flexDirection="column" gap={2}>
          <Typography component="h3" variant="h4">
            Name
          </Typography>
          <EditUnit unit={unit} />
          <Typography component="h3" variant="h4">
            Editors
          </Typography>
          <UnitEditors unit={unit} />
        </Box>
      </ModalWrapper>
    </>
  );
};
