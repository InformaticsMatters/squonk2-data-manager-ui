import type { ProjectId } from '../../hooks/currentProjectHooks';

export interface CommonModalProps {
  /**
   * Whether the modal should be open or not
   */
  open: boolean;
  /**
   * ID of the project inside which the instance is created
   */
  projectId: ProjectId;
  /**
   * Called when a close action is initiated. E.g. close button, submit or click-away
   */
  onClose: () => void;
  /**
   * Called after an instance is created. Optional, skipped if not provided.
   */
  onLaunch?: () => void;
}
