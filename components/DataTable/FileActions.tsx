import type { FC } from 'react';
import React from 'react';

import { useCurrentProjectId } from '../state/currentProjectHooks';
import { CreateDatasetFromFileButton } from './Actions/CreateDatasetFromFileButton';
import { DetachDataset } from './Actions/DetachDataset';
import type { TableDir, TableFile } from './types';
import { isTableDir } from './utils';

interface FileActionsProps {
  file: TableFile | TableDir;
}

export const FileActions: FC<FileActionsProps> = ({ file }) => {
  const { projectId } = useCurrentProjectId();

  if (projectId) {
    return (
      <>
        {!isTableDir(file) && file.file_id && (
          <DetachDataset fileId={file.file_id} projectId={projectId} />
        )}
        {!isTableDir(file) && (!file.immutable || file.file_id === undefined) && (
          <CreateDatasetFromFileButton file={file} projectId={projectId} />
        )}
      </>
    );
  }
  return null;
};
