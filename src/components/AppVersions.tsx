import { useGetVersion as useGetASAPIVersion } from "@squonk/account-server-client/state";
import { useGetVersion as useGetDMAPIVersion } from "@squonk/data-manager-client/accounting";

import { ListItem as MuiListItem, ListItemText, styled, Typography } from "@mui/material";

import { HorizontalList } from "./HorizontalList";

export const getGetDMVersionQueryKey = () => ["data-manager", "/version"];
export const getGetASVersionQueryKey = () => ["account-server", "/version"];

export const AppVersions = () => {
  const { data: dmData } = useGetDMAPIVersion();
  const { data: asData } = useGetASAPIVersion();

  return (
    <>
      <Typography variant="subtitle2">Versions</Typography>
      <HorizontalList dense>
        <ListItem>
          <ListItemText primary={`UI: ${process.env.NEXT_PUBLIC_APP_VERSION}`} />
        </ListItem>
        {!!dmData?.version && (
          <ListItem>
            <ListItemText primary={`Data Manager: ${dmData.version}`} />
          </ListItem>
        )}
        {!!asData?.version && (
          <ListItem>
            <ListItemText primary={`Account Server: ${asData.version}`} />
          </ListItem>
        )}
      </HorizontalList>
    </>
  );
};

const ListItem = styled(MuiListItem)({ paddingLeft: 0 });
