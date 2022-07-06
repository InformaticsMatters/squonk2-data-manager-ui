import { useState } from "react";

import { NoteAdd } from "@mui/icons-material";
import { ListItem, ListItemText } from "@mui/material";

import { useSelectedOrganisation } from "../../../../../../state/organisationSelection";
import { useSelectedUnit } from "../../../../../../state/unitSelection";
import { CreateProjectForm } from "../../../../../CreateProjectForm";

/**
 * Button which allows user to create a new project.
 */
export const CreateProjectListItem = () => {
  const [open, setOpen] = useState(false);

  const [unit] = useSelectedUnit();
  const [organisation] = useSelectedOrganisation();

  return (
    <>
      <ListItem
        button
        disabled={organisation === undefined || unit === undefined}
        onClick={() => setOpen(true)}
      >
        <ListItemText
          primary="Create Project"
          secondary="Creates a new project in the currently selected context"
        />
        <NoteAdd color="action" />
      </ListItem>

      {!!organisation && !!unit && (
        <CreateProjectForm
          modal={{
            id: "create-project",
            title: "Create Project",
            submitText: "Create",
            open,
            onClose: () => setOpen(false),
          }}
          orgAndUnit={[organisation.id, unit.id]}
        />
      )}
    </>
  );
};
