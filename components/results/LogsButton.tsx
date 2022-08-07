import type { InstanceSummary } from "@squonk/data-manager-client";

import { Button } from "@mui/material";
import Link from "next/link";
import { useRouter } from "next/router";

export interface LogsButtonProps {
  instance: InstanceSummary;
}

export const LogsButton = ({ instance }: LogsButtonProps) => {
  const { query } = useRouter();
  return (
    <Link
      passHref
      href={{
        pathname: "/project",
        query: {
          ...query,
          project: instance.project_id,
          path: `.${instance.id}`,
        },
      }}
    >
      <Button>Logs</Button>
    </Link>
  );
};
