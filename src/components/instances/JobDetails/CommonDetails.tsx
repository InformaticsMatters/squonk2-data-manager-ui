import { type InstanceGetResponse } from "@/api/data-manager";

import { ListItem, ListItemIcon, ListItemText } from "@mui/material";

import { ApplicationIcon, CoinsIcon } from "../../icons";

export interface CommonDetailsProps {
  instance: InstanceGetResponse;
}

/**
 * What every instance accounts for, whatever it ran. What an instance has spent is only known once
 * it reports it — the Data Manager sets it as the work runs — so an instance that reported neither
 * coins nor cost says nothing rather than naming an amount it never gave.
 */
export const CommonDetails = ({ instance }: CommonDetailsProps) => {
  return (
    <>
      {instance.coins === undefined && instance.cost === undefined ? null : (
        <ListItem>
          <ListItemIcon sx={{ minWidth: "40px" }}>
            <CoinsIcon />
          </ListItemIcon>
          <ListItemText
            primary={
              instance.coins === undefined ? "Coins not reported" : `Coins: C${instance.coins}`
            }
            secondary={instance.cost === undefined ? undefined : `Cost: ${instance.cost}`}
          />
        </ListItem>
      )}
      <ListItem>
        <ListItemIcon sx={{ minWidth: "40px" }}>
          <ApplicationIcon />
        </ListItemIcon>
        <ListItemText primary={instance.application_id} secondary={instance.application_version} />
      </ListItem>
    </>
  );
};
