import { List } from '@material-ui/core';

import { FilePlainTextViewerListItem } from './FilePlainTextViewerListItem';

export interface ProjectViewSectionProps {
  fileId: string;
}

export const ProjectViewSection = ({ fileId }: ProjectViewSectionProps) => {
  return (
    <List>
      <FilePlainTextViewerListItem fileId={fileId} />
    </List>
  );
};
