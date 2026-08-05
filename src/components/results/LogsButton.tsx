import { type InstanceSummary } from "@/api/data-manager";

import { projectLinks } from "../../projects/routes";
import { NextLink } from "../NextLink";

export interface LogsButtonProps {
  /**
   * ID of the instance
   */
  instanceId: InstanceSummary["id"];
  /**
   * The project the instance itself declares it belongs to
   */
  projectId: string;
}

/** Opens the instance's own log directory in the Files section of the project that owns it. */
export const LogsButton = ({ instanceId, projectId }: LogsButtonProps) => {
  return (
    <NextLink
      component="button"
      href={projectLinks.files(projectId, { path: `/.${instanceId}` }) as never}
    >
      Logs
    </NextLink>
  );
};
