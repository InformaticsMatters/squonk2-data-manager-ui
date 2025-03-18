import { type InstanceGetResponse, type InstanceSummary } from "@squonk/data-manager-client";

import { useRouter } from "next/router";

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
  const { query } = useRouter();
  return (
    <NextLink
      component="button"
      href={{
        pathname: "/project",
        query: { ...query, project: instance.project_id, path: `.${instanceId}` },
      }}
    >
      Logs
    </NextLink>
  );
};
