import type { InstanceSummary } from "@squonk/data-manager-client";
import { useGetInstances } from "@squonk/data-manager-client/instance";

import { Box, List, ListItemButton, ListItemText, Typography } from "@mui/material";
import dayjs from "dayjs";
import NextLink from "next/link";
import { useRouter } from "next/router";

import { useCurrentProjectId } from "../../hooks/projectHooks";
import { CenterLoader } from "../CenterLoader";
import { LocalTime } from "../LocalTime";

type FilterPredicate = (value: InstanceSummary, index: number, array: InstanceSummary[]) => boolean;

export interface InstancesListProps {
  /**
   * Predicate of `Array.prototype.filter`
   */
  predicate: FilterPredicate;
}

/**
 * MuiList detailing instances that match a filter.
 */
export const InstancesList = ({ predicate }: InstancesListProps) => {
  const { query } = useRouter();

  const { projectId } = useCurrentProjectId();
  const { data } = useGetInstances({ project_id: projectId ?? undefined });
  const instances = data?.instances.filter(predicate);

  if (instances === undefined) {
    return <CenterLoader />;
  }

  if (instances.length === 0) {
    return (
      <Box p={2}>
        <Typography variant="body2">No instances of this type currently exist</Typography>
      </Box>
    );
  }

  return (
    <List dense component="ul">
      {instances
        .sort((instanceA, instanceB) =>
          dayjs(instanceA.launched).isBefore(dayjs(instanceB.launched)) ? 1 : -1,
        )
        .map((instance) => (
          <NextLink
            legacyBehavior
            passHref
            href={{
              pathname: "/results/instance/[instanceId]",
              query: { ...query, instanceId: instance.id, project: projectId },
            }}
            key={instance.id}
          >
            <ListItemButton component="a">
              <ListItemText
                primary={instance.name}
                primaryTypographyProps={{ variant: "body1" }}
                secondary={<LocalTime utcTimestamp={instance.launched} />}
              />
            </ListItemButton>
          </NextLink>
        ))}
    </List>
  );
};
