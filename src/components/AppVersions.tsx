import { useGetVersion as useGetASAPIVersion } from "@/api/account-server/state";
import { useGetVersion as useGetDMAPIVersion } from "@/api/data-manager/accounting";

import { ListItem as MuiListItem, ListItemText, Skeleton, styled, Typography } from "@mui/material";

import { useIsClient } from "../hooks/useIsClient";
import { HorizontalList } from "./HorizontalList";

/** One API's version, with a placeholder holding its place until it answers. */
const ApiVersion = ({
  isPending,
  label,
  version,
}: {
  isPending: boolean;
  label: string;
  version?: string;
}) =>
  isPending || version ? (
    <ListItem>
      <ListItemText
        primary={
          <>
            {label}: {version ?? <Skeleton sx={{ display: "inline-block" }} width={48} />}
          </>
        }
      />
    </ListItem>
  ) : null;

export const AppVersions = () => {
  // Read in the browser only; a read that has not started is pending, so the server renders the
  // placeholders the browser will fill.
  const isClient = useIsClient();
  const dataManager = useGetDMAPIVersion({ query: { enabled: isClient } });
  const accountServer = useGetASAPIVersion({ query: { enabled: isClient } });

  return (
    <>
      <Typography variant="subtitle2">Versions</Typography>
      <HorizontalList dense>
        <ListItem>
          <ListItemText primary={`UI: ${process.env.NEXT_PUBLIC_APP_VERSION}`} />
        </ListItem>
        <ApiVersion
          isPending={dataManager.isPending}
          label="Data Manager"
          version={dataManager.data?.version}
        />
        <ApiVersion
          isPending={accountServer.isPending}
          label="Account Server"
          version={accountServer.data?.version}
        />
      </HorizontalList>
    </>
  );
};

const ListItem = styled(MuiListItem)({ paddingLeft: 0 });
