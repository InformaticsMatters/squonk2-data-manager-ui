import { useQuery } from "react-query";

import { getVersion as getASVersion } from "@squonk/account-server-client/state";
import { getVersion as getDMVersion } from "@squonk/data-manager-client/accounting";

import { ListItem, ListItemText, Typography } from "@mui/material";

import { HorizontalList } from "./HorizontalList";

export const getGetDMVersionQueryKey = () => ["data-manager", "/version"];
export const getGetASVersionQueryKey = () => ["account-server", "/version"];

export const AppVersions = () => {
  const { data: dmData } = useQuery(getGetDMVersionQueryKey(), getDMVersion);
  const { data: asData } = useQuery(getGetASVersionQueryKey(), getASVersion);

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
