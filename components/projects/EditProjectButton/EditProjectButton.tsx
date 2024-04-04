import type { ReactNode } from "react";
import { useState } from "react";

import { useGetProject } from "@squonk/data-manager-client/project";

import { EditProjectModal } from "./EditProjectModal";

interface ChildProps {
  openDialog: () => void;
  open: boolean;
}

export interface EditProjectButtonProps {
  /**
   * ID of project to be edited.
   */
  projectId: string;
  /**
   * child render prop
   */
  children: (props: ChildProps) => ReactNode;
}

/**
 * Button controlling a modal with options to edit the project editors
 */
export const EditProjectButton = ({ projectId, children }: EditProjectButtonProps) => {
  const [open, setOpen] = useState(false);

  const { data: project } = useGetProject(projectId);

  if (!project) {
    return null;
  }

  return (
    <>
      {children({ openDialog: () => setOpen(true), open })}

      <EditProjectModal open={open} projectId={project.project_id} onClose={() => setOpen(false)} />
    </>
  );
};
