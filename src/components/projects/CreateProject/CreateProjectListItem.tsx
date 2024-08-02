import { useState } from "react";

import { type UnitAllDetail } from "@squonk/account-server-client";

import { NoteAdd } from "@mui/icons-material";
import { ListItemButton, ListItemIcon, ListItemText } from "@mui/material";

import { CreateProjectForm } from "./CreateProjectForm";

export interface CreateProjectListItemProps {
  unit: UnitAllDetail;
}

/**
 * Button which allows user to create a new project.
 */
export const CreateProjectListItem = ({ unit }: CreateProjectListItemProps) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <ListItemButton onClick={() => setOpen(true)}>
        <ListItemText
          primary="Create Project"
          secondary="Create a new project in the selected unit"
        />
        <ListItemIcon>
          <NoteAdd color="action" />
        </ListItemIcon>
      </ListItemButton>

      <CreateProjectForm
        defaultPrivacy={unit.default_product_privacy}
        modal={{
          id: "create-project",
          title: "Create Project",
          submitText: "Create",
          open,
          onClose: () => setOpen(false),
        }}
        unitId={unit.id}
      />
    </>
  );
};
