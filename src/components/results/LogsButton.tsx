import { type InstanceGetResponse, type InstanceSummary } from "@/api/data-manager";

import { NextLink } from "../NextLink";

export interface LogsButtonProps {
  /**
   * ID of the instance
   */
  instanceId: InstanceSummary["id"];
  /**
   * Instance summary or detail
   */
  instance: InstanceGetResponse | InstanceSummary;
}

export const LogsButton = ({ instanceId, instance }: LogsButtonProps) => {
  return (
    <NextLink
      component="button"
      href={{
        pathname: "/project",
        query: { project: instance.project_id, path: `.${instanceId}` },
      }}
    >
      Logs
    </NextLink>
  );
};
