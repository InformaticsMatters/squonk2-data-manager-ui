import { ListItem as MuiListItem, ListItemText, styled, Typography } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";

import { HorizontalList } from "./HorizontalList";

export const getGetDMVersionQueryKey = () => ["data-manager", "/version"];
export const getGetASVersionQueryKey = () => ["account-server", "/version"];

export const AppVersions = () => {
  const { data: dmData } = useQuery(getGetDMVersionQueryKey(), () =>
    axios
      .get(process.env.NEXT_PUBLIC_DATA_MANAGER_API_SERVER + "/version")
      .then(({ data }) => data),
  );
  const { data: asData } = useQuery(getGetASVersionQueryKey(), () =>
    axios
      .get(process.env.NEXT_PUBLIC_ACCOUNT_SERVER_API_SERVER + "/version")
      .then(({ data }) => data),
  );

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

const ListItem = styled(MuiListItem)({ paddingLeft: 0 });
