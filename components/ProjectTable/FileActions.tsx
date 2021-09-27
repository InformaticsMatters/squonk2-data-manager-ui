import React from 'react';

import { useCurrentProjectId } from '../../hooks/currentProjectHooks';
import { CreateDatasetFromFileButton } from './Buttons/CreateDatasetFromFileButton';
import { DeleteUnmanagedFileButton } from './Buttons/DeleteUnmanagedFileButton';
import { DetachDataset } from './Buttons/DetachDataset';
import { FavouriteButton } from './Buttons/FavouriteButton';
import type { TableDir, TableFile } from './types';
import { isTableDir } from './utils';

export interface FileActionsProps {
  /**
   * File the actions act on
   */
  file: TableFile | TableDir;
}

/**
 * Actions the user can execute on a given file
 */
export const FileActions = ({ file }: FileActionsProps) => {
  const { projectId } = useCurrentProjectId();

  if (!projectId) {
    return null;
  }
  const isFile = !isTableDir(file);

  const fileId = isFile ? file.file_id : undefined;

  const isManagedFile = isFile && fileId !== undefined;

  return (
    <>
      <FavouriteButton
        fullPath={file.fullPath}
        mimeType={isTableDir(file) ? undefined : file.mime_type}
        projectId={projectId}
        type={isTableDir(file) ? 'directory' : 'file'}
      />

      {/* Actions for files only */}

      {/* Managed files are "detached" */}
      {isManagedFile && <DetachDataset fileId={fileId} projectId={projectId} />}
      {/* Unmanaged files are "deleted" */}
      {!isManagedFile && (
        <DeleteUnmanagedFileButton
          fileName={file.fileName}
          path={'/' + file.fullPath.split('/').slice(0, -1).join('/')}
          projectId={projectId}
        />
      )}
      {/* Datasets can be created from unmanaged files or managed files at are immutable */}
      {isFile && (!file.immutable || !isManagedFile) && (
        <CreateDatasetFromFileButton file={file} projectId={projectId} />
      )}
    </>
  );
};
