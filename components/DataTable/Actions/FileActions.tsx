import type { FC } from 'react';
import React from 'react';

import { useCurrentProjectId } from '../../state/currentProjectHooks';
import type { TableDir, TableFile } from '../types';
import { isTableDir } from '../utils';
import { CreateDatasetFromFileButton } from './Buttons/CreateDatasetFromFileButton';
import { DeleteUnmanagedFileButton } from './Buttons/DeleteUnmanagedFileButton';
import { DetachDataset } from './Buttons/DetachDataset';

interface FileActionsProps {
  file: TableFile | TableDir;
}

export const FileActions: FC<FileActionsProps> = ({ file }) => {
  const { projectId } = useCurrentProjectId();

  if (projectId && !isTableDir(file)) {
    return (
      <>
        {file.file_id && <DetachDataset fileId={file.file_id} projectId={projectId} />}
        {!file.file_id && (
          <DeleteUnmanagedFileButton
            fileName={file.fileName}
            path={'/' + file.fullPath.split('/').slice(0, -1).join('/')}
            projectId={projectId}
          />
        )}
        {(!file.immutable || file.file_id === undefined) && (
          <CreateDatasetFromFileButton file={file} projectId={projectId} />
        )}
      </>
    );
  }
  return null;
};
