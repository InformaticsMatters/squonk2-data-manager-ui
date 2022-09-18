import { useState } from "react";

import type { UnitDetail } from "@squonk/account-server-client";

import { NoteAdd } from "@mui/icons-material";
import { ListItem, ListItemText } from "@mui/material";

import { CreateProjectForm } from "./CreateProjectForm";

export interface CreateProjectListItemProps {
  unit: UnitDetail;
}

/**
 * Button which allows user to create a new project.
 */
export const CreateProjectListItem = ({ unit }: CreateProjectListItemProps) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <ListItem button onClick={() => setOpen(true)}>
        <ListItemText
          primary="Create Project"
          secondary="Creates a new project in the currently selected context"
        />
        <NoteAdd color="action" />
      </ListItem>

      <CreateProjectForm
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
