import { useState } from "react";

import type { ProjectDetail } from "@squonk/data-manager-client";

import { Edit as EditIcon } from "@mui/icons-material";
import { Box, IconButton, Tooltip, Typography } from "@mui/material";

import { ModalWrapper } from "../../modals/ModalWrapper";
import { PrivateProjectToggle } from "./PrivateProjectToggle";
import { ProjectAdministrators } from "./ProjectAdministrators";
import { ProjectEditors } from "./ProjectEditors";
import { ProjectObservers } from "./ProjectObservers";

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

  return (
    <>
      <Tooltip title={"Edit Project"}>
        <span>
          <IconButton size="small" sx={{ p: "1px" }} onClick={() => setOpen(!open)}>
            <EditIcon />
          </IconButton>
        </span>
      </Tooltip>

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

        <PrivateProjectToggle isPrivate={project.private} projectId={project.project_id} />

        <Box display="flex" flexDirection="column" gap={2}>
          <ProjectAdministrators project={project} />
          <ProjectEditors project={project} />
          <ProjectObservers project={project} />
        </Box>
      </ModalWrapper>
    </>
  );
};
