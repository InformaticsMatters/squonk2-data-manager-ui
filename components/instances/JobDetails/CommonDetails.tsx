import type { InstanceGetResponse } from "@squonk/data-manager-client";

import AppsRoundedIcon from "@mui/icons-material/AppsRounded";
import PaymentIcon from "@mui/icons-material/Payment";
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
