import { useGetInstance } from "@squonk/data-manager-client/instance";

import { Button } from "@mui/material";
import NextLink from "next/link";

export interface AllResultsButtonProps {
  instanceId: string;
}

export const AllResultsButton = ({ instanceId }: AllResultsButtonProps) => {
  const { data: instance, isLoading, isError } = useGetInstance(instanceId);

  return (
    <NextLink passHref href={{ pathname: "/results", query: { project: instance?.project_id } }}>
      <Button color="primary" disabled={isLoading || isError}>
        See all results
      </Button>
    </NextLink>
  );
};
