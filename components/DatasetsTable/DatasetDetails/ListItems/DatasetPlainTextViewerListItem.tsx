import { ListItem, ListItemText } from '@material-ui/core';
import { Description } from '@material-ui/icons';
import NextLink from 'next/link';

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
        pathname: '/dataset/[datasetId]/[datasetVersion]',
        query: {
          datasetId,
          datasetVersion: version,
        },
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
