import { type RunCapabilities } from "../../projects/runCapabilities";
import { type LaunchOutcome } from "../../projects/useRunCommands";

export interface RunModalProps {
  /**
   * What the caller may do with this definition in this project, decided by the project the URL
   * addresses rather than by any selection.
   */
  capabilities: RunCapabilities;
  /**
   * Whether the modal should be open or not
   */
  open: boolean;
  /**
   * ID of the project inside which the execution is created. Always the project in the URL.
   */
  projectId: string;
  /**
   * Called when a close action is initiated. E.g. close button, or click-away
   */
  onClose: () => void;
  /**
   * Called only once the Data Manager has accepted the launch, with the execution it created.
   */
  onLaunched: (outcome: LaunchOutcome) => void;
}
