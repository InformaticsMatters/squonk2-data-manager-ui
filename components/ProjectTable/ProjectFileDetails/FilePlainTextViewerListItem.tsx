import { ListItem, ListItemText } from '@material-ui/core';
import { Description } from '@material-ui/icons';
import NextLink from 'next/link';

export interface FilePlainTextViewerListItemProps {
  fileId: string;
}

export const FilePlainTextViewerListItem = ({ fileId }: FilePlainTextViewerListItemProps) => {
  return (
    <NextLink
      passHref
      href={{
        pathname: '/file/[fileId]',
        query: {
          fileId,
        },
      }}
    >
      <ListItem button component="a" rel="noopener noreferrer" target="_blank">
        <ListItemText primary="Plaintext Viewer" secondary="Displays the file as plaintext" />
        <Description color="action" />
      </ListItem>
    </NextLink>
  );
};
