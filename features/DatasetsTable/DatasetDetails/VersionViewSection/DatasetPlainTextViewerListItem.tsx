import { Description } from "@mui/icons-material";
import { ListItemButton, ListItemText } from "@mui/material";
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
      legacyBehavior
      passHref
      href={{
        pathname: "/dataset/[datasetId]/[datasetVersion]",
        query: { datasetId, datasetVersion: String(version) },
      }}
    >
      <ListItemButton component="a" rel="noopener noreferrer" target="_blank">
        <ListItemText
          primary="Plaintext Viewer"
          secondary="Displays the dataset version as plaintext"
        />
        <Description color="action" />
      </ListItemButton>
    </NextLink>
  );
};
