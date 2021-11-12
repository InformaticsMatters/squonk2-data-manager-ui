import { List } from '@material-ui/core';

import type { TableFile } from '../../types';
import { FilePlainTextViewerListItem } from './FilePlainTextViewerListItem';

export interface ProjectViewSectionProps {
  file: TableFile;
}

export const ProjectViewSection = ({ file }: ProjectViewSectionProps) => {
  return (
    <List>
      <FilePlainTextViewerListItem fileName={file.fileName} />
    </List>
  );
};
