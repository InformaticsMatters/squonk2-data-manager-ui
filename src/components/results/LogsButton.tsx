import { resultInstanceLogsPath } from "../../projects/instanceFacts";
import { projectLinks } from "../../projects/routes";
import { NextLink } from "../NextLink";

export interface LogsButtonProps {
  instanceId: string;
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
      href={projectLinks.files(projectId, { path: resultInstanceLogsPath(instanceId) }) as never}
    >
      Logs
    </NextLink>
  );
};
