import { type InstanceSummary } from "@/api/data-manager";
import { useGetInstances } from "@/api/data-manager/instance";

import { Box, LinearProgress, List, ListItemButton, ListItemText, Typography } from "@mui/material";
import dayjs from "dayjs";
import A from "next/link";

import { useCurrentProjectId } from "../../hooks/projectHooks";
import { projectLinks } from "../../projects/routes";
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
  const { projectId } = useCurrentProjectId();
  const { data } = useGetInstances({ project_id: projectId ?? undefined });
  const instances = data?.instances.filter((element, index, array) =>
    predicate(element, index, array),
  );

  if (instances === undefined) {
    return <LinearProgress />;
  }

  if (instances.length === 0) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography sx={{ color: "text.secondary" }} variant="body2">
          No instances currently exist
        </Typography>
      </Box>
    );
  }

  return (
    <List dense component="ul">
      {instances
        .toSorted((instanceA, instanceB) =>
          dayjs(instanceA.launched).isBefore(dayjs(instanceB.launched)) ? 1 : -1,
        )
        .map((instance) => (
          <ListItemButton
            component={A}
            href={projectLinks.result(instance.project_id, "instances", instance.id) as never}
            key={instance.id}
          >
            <ListItemText
              primary={instance.name}
              secondary={
                <>
                  <LocalTime utcTimestamp={instance.launched} /> - version: {instance.job_version}
                </>
              }
              slotProps={{ primary: { variant: "body1" } }}
            />
          </ListItemButton>
        ))}
    </List>
  );
};
