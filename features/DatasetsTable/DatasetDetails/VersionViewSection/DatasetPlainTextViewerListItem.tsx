import { Description } from "@mui/icons-material";
import { ListItem, ListItemText } from "@mui/material";
import NextLink from "next/link";

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
        pathname: "/dataset/[datasetId]/[datasetVersion]",
        query: { datasetId, datasetVersion: String(version) },
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
