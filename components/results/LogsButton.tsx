import type { InstanceGetResponse, InstanceSummary } from "@squonk/data-manager-client";

import { Button } from "@mui/material";
import Link from "next/link";
import { useRouter } from "next/router";

export interface LogsButtonProps {
  /**
   * ID of the instance
   */
  instanceId: InstanceSummary["id"];
  /**
   * Instance summary or detail
   */
  instance: InstanceSummary | InstanceGetResponse;
}

export const LogsButton = ({ instanceId, instance }: LogsButtonProps) => {
  const { query } = useRouter();
  return (
    <Link
      legacyBehavior
      passHref
      href={{
        pathname: "/project",
        query: {
          ...query,
          project: instance.project_id,
          path: `.${instanceId}`,
        },
      }}
    >
      <Button>Logs</Button>
    </Link>
  );
};
