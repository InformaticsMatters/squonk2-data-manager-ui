import { useGetVersion as useGetASVersion } from "@squonk/account-server-client/state";
import { useGetVersion as useGetDMVersion } from "@squonk/data-manager-client/accounting";

import { ListItem, ListItemText, Typography } from "@mui/material";

import { HorizontalList } from "./results/common/HorizontalList";

export const AppVersions = () => {
  const { data: dmData } = useGetDMVersion();
  const { data: asData } = useGetASVersion();

  return (
    <>
      <Typography variant="subtitle2">Versions</Typography>
      <HorizontalList dense>
        <ListItem>
          <ListItemText primary={`UI: ${process.env.NEXT_PUBLIC_APP_VERSION}`} />
        </ListItem>
        {dmData?.version && (
          <ListItem>
            <ListItemText primary={`Data Manager: ${dmData.version}`} />
          </ListItem>
        )}
        {asData?.version && (
          <ListItem>
            <ListItemText primary={`Account Server: ${asData.version}`} />
          </ListItem>
        )}
      </HorizontalList>
    </>
  );
};
