import { type InstanceSummary } from "@/api/data-manager";

import { Box, List, ListItemButton, ListItemText, Typography } from "@mui/material";
import A from "next/link";

import { projectLinks } from "../../projects/routes";
import { LocalTime } from "../LocalTime";

export interface InstancesListProps {
  /**
   * The instances of one definition, already constrained to the project that owns them.
   */
  instances: readonly InstanceSummary[];
}

/**
 * MuiList detailing the existing instances of one definition. The instances are given to it, so
 * the list neither issues a read of its own nor consults a project other than the one that owns
 * each instance it links to.
 */
export const InstancesList = ({ instances }: InstancesListProps) => {
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
      {instances.map((instance) => (
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
