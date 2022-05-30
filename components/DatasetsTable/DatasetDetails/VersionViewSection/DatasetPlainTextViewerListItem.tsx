import { Description } from "@mui/icons-material";
import { ListItem, ListItemText } from "@mui/material";
import NextLink from "next/link";

import { APP_ROUTES } from "../../../../constants/routes";

export interface DatasetPlainTextViewerListItemProps {
  datasetId: string;
  version: number;
}

export const DatasetPlainTextViewerListItem = ({
  datasetId,
  version,
}: DatasetPlainTextViewerListItemProps) => {
  return (
    <NextLink
      passHref
      href={{
        pathname: APP_ROUTES.dataset.version(datasetId, version),
      }}
    >
      <ListItem button component="a" rel="noopener noreferrer" target="_blank">
        <ListItemText
          primary="Plaintext Viewer"
          secondary="Displays the dataset version as plaintext"
        />
        <Description color="action" />
      </ListItem>
    </NextLink>
  );
};
