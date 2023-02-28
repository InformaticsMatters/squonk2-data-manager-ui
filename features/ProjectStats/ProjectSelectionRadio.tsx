import { Radio } from "@mui/material";

import type { ProjectId } from "../../hooks/projectHooks";
import { useCurrentProjectId } from "../../hooks/projectHooks";

export interface ProjectSelectionRadioProps {
  /**
   * Project product ID.
   */
  projectId: ProjectId;
}

/**
 * Radio button which selects or unselects a project.
 */
export const ProjectSelectionRadio = ({ projectId }: ProjectSelectionRadioProps) => {
  const { projectId: currentProjectId, setCurrentProjectId } = useCurrentProjectId();

  const isProjectSelected = currentProjectId === projectId;

  return (
    <Radio
      checked={isProjectSelected}
      sx={{ p: "1px" }}
      onClick={() => {
        if (isProjectSelected) {
          setCurrentProjectId();
        } else {
          setCurrentProjectId(projectId);
        }
      }}
    />
  );
};
