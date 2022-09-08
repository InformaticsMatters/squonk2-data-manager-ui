import { useQuery } from "react-query";

import { ListItem, ListItemText, Typography } from "@mui/material";
import axios from "axios";

import { AS_API_URL, DM_API_URL } from "../constants/proxies";
import { HorizontalList } from "./HorizontalList";

export const getGetDMVersionQueryKey = () => ["data-manager", "/version"];
export const getGetASVersionQueryKey = () => ["account-server", "/version"];

export const AppVersions = () => {
  const { data: dmData } = useQuery(getGetDMVersionQueryKey(), () =>
    axios.get(DM_API_URL + "/version").then(({ data }) => data),
  );
  const { data: asData } = useQuery(getGetASVersionQueryKey(), () =>
    axios.get(AS_API_URL + "/version").then(({ data }) => data),
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
