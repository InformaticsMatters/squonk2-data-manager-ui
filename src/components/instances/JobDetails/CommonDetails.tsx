import { type InstanceGetResponse } from "@squonk/data-manager-client";

import { AppsRounded as AppsRoundedIcon, Payment as PaymentIcon } from "@mui/icons-material";
import { ListItem, ListItemIcon, ListItemText } from "@mui/material";

export interface CommonDetailsProps {
  instance: InstanceGetResponse;
}

export const CommonDetails = ({ instance }: CommonDetailsProps) => {
  return (
    <>
      <ListItem>
        <ListItemIcon sx={{ minWidth: "40px" }}>
          <PaymentIcon />
        </ListItemIcon>
        <ListItemText primary={`Coins: C${instance.coins}`} secondary={`Cost: ${instance.cost}`} />
      </ListItem>
      <ListItem>
        <ListItemIcon sx={{ minWidth: "40px" }}>
          <AppsRoundedIcon />
        </ListItemIcon>
        <ListItemText primary={instance.application_id} secondary={instance.application_version} />
      </ListItem>
    </>
  );
};
