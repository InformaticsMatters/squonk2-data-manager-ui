import { useGetProject } from "@squonk/data-manager-client/project";

import { Box, Typography } from "@mui/material";

import { ModalWrapper } from "../../modals/ModalWrapper";
import { PrivateProjectToggle } from "./PrivateProjectToggle";
import { ProjectAdministrators } from "./ProjectAdministrators";
import { ProjectEditors } from "./ProjectEditors";
import { ProjectObservers } from "./ProjectObservers";

export interface EditProjectModalProps {
  projectId: string;
  open: boolean;
  onClose: () => void;
  onMemberChange?: () => Promise<void>;
}

export const EditProjectModal = ({
  open,
  projectId,
  onClose,
  onMemberChange,
}: EditProjectModalProps) => {
  const { data: project } = useGetProject(projectId);

  if (project === undefined) {
    return null;
  }

  return (
    <ModalWrapper
      DialogProps={{ maxWidth: "sm", fullWidth: true }}
      id="edit-project"
      open={open}
      submitText="Save"
      title="Edit Project"
      onClose={onClose}
    >
      <Typography gutterBottom variant="h5">
        {project.name}
      </Typography>

      <PrivateProjectToggle isPrivate={project.private} projectId={project.project_id} />

      <Box display="flex" flexDirection="column" gap={2}>
        <ProjectAdministrators
          administrators={project.administrators}
          projectId={project.project_id}
          onChange={onMemberChange}
        />
        <ProjectEditors
          editors={project.editors}
          projectId={project.project_id}
          onChange={onMemberChange}
        />
        <ProjectObservers
          observers={project.observers}
          projectId={project.project_id}
          onChange={onMemberChange}
        />
      </Box>
    </ModalWrapper>
  );
};
