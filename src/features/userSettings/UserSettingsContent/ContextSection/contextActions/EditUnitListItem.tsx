import { useState } from "react";

import { type UnitAllDetail } from "@squonk/account-server-client";

import { Edit as EditIcon } from "@mui/icons-material";
import { Box, ListItemButton, ListItemIcon, ListItemText, Typography } from "@mui/material";

import { ModalWrapper } from "../../../../../components/modals/ModalWrapper";
import { EditDefaultPrivacy } from "../../../../../components/units/EditDefaultPrivacy";
import { EditUnitName } from "../../../../../components/units/EditUnitName";
import { UnitMembers } from "../../../../../components/units/UnitMembers";

export interface EditUnitListItemProps {
  unit: UnitAllDetail;
}

export const EditUnitListItem = ({ unit }: EditUnitListItemProps) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <ListItemButton onClick={() => setOpen((open) => !open)}>
        <ListItemText primary="Edit Unit" secondary="Modify a unit" />
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
          <Typography variant="subtitle1">Owner: {unit.owner_id}</Typography>
          <Typography component="h3" variant="h4">
            Name
          </Typography>
          <EditUnitName unit={unit} />
          <Typography component="h3" variant="h4">
            Default Project Privacy
          </Typography>
          <EditDefaultPrivacy unit={unit} />
          <Typography component="h3" variant="h4">
            Members
          </Typography>
          <UnitMembers unit={unit} />
        </Box>
      </ModalWrapper>
    </>
  );
};
