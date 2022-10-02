import { useState } from "react";

import type { ProjectDetail } from "@squonk/data-manager-client";

import EditIcon from "@mui/icons-material/Edit";
import { IconButton, Tooltip, Typography } from "@mui/material";

import { useKeycloakUser } from "../../../hooks/useKeycloakUser";
import { ModalWrapper } from "../../modals/ModalWrapper";
import { PrivateProjectToggle } from "./PrivateProjectToggle";
import { ProjectEditors } from "./ProjectEditors";

export interface EditProjectButtonProps {
  /**
   * Project to be edited.
   */
  project: ProjectDetail;
}

/**
 * Button controlling a modal with options to edit the project editors
 */
export const EditProjectButton = ({ project }: EditProjectButtonProps) => {
  const [open, setOpen] = useState(false);

  const { user } = useKeycloakUser();
  const isEditor = !!user.username && !!project.editors.includes(user.username);

  return (
    <>
      {isEditor && (
        <Tooltip title={"Edit Project"}>
          <span>
            <IconButton size="small" sx={{ p: "1px" }} onClick={() => setOpen(!open)}>
              <EditIcon />
            </IconButton>
          </span>
        </Tooltip>
      )}
      <ModalWrapper
        DialogProps={{ maxWidth: "sm", fullWidth: true }}
        id="edit-project"
        open={open}
        submitText="Save"
        title="Edit Project"
        onClose={() => setOpen(false)}
      >
        <Typography gutterBottom variant="h5">
          {project.name}
        </Typography>

        <Typography gutterBottom>
          <b>Owner</b>: {project.owner}
        </Typography>

        <PrivateProjectToggle isPrivate={project.private} projectId={project.project_id} />

        <ProjectEditors project={project} />
      </ModalWrapper>
    </>
  );
};
