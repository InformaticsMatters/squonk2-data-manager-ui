import { ListItem, ListItemText } from '@material-ui/core';
import { Description } from '@material-ui/icons';
import NextLink from 'next/link';
import { useRouter } from 'next/router';

import { APP_ROUTES } from '../../../../constants/routes';

export interface FilePlainTextViewerListItemProps {
  fileName: string;
}

export const FilePlainTextViewerListItem = ({ fileName }: FilePlainTextViewerListItemProps) => {
  const {
    query: { project, path },
  } = useRouter();

  return (
    <NextLink
      passHref
      href={{
        pathname: APP_ROUTES.project.file,
        query: {
          projectId: project,
          file: fileName,
          path,
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
