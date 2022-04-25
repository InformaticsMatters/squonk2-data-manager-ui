import type { ReactNode } from 'react';
import { useCallback } from 'react';
import type { DropzoneState, FileRejection } from 'react-dropzone';
import { useDropzone } from 'react-dropzone';
import { useQueryClient } from 'react-query';

import { getGetFilesQueryKey } from '@squonk/data-manager-client/file';
import { useAddFileToProject } from '@squonk/data-manager-client/project';

import { css } from '@emotion/react';
import { useSnackbar } from 'notistack';

import { useCurrentProjectId } from '../../hooks/projectHooks';
import { useProjectBreadcrumbs } from '../../hooks/projectPathHooks';
import { useFileExtensions } from '../../hooks/useFileExtensions';
import { getErrorMessage } from '../../utils/orvalError';
import { FileHoverCover } from './FileHoverCover';

export interface ProjectFileUploadProps {
  children: (open: DropzoneState['open']) => ReactNode;
}

export const ProjectFileUpload = ({ children }: ProjectFileUploadProps) => {
  const allowedFileTypes = useFileExtensions();

  const { projectId } = useCurrentProjectId();
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();

  const breadcrumbs = useProjectBreadcrumbs();
  const path = '/' + breadcrumbs.join('/');

  const { mutateAsync: uploadProjectFile } = useAddFileToProject();

  const queryClient = useQueryClient();

  const uploadFile = useCallback(
    async (file: File) => {
      const key = enqueueSnackbar(`Uploading file ${file.name}`, { autoHideDuration: 10000 });
      if (projectId) {
        try {
          await uploadProjectFile({
            projectId,
            data: { as_filename: file.name, file, path },
          });
          enqueueSnackbar(`${file.name} was uploaded`, { variant: 'success' });
          queryClient.invalidateQueries(getGetFilesQueryKey({ project_id: projectId, path }));
        } catch (err) {
          const error = getErrorMessage(err);
          enqueueSnackbar(`The upload of ${file.name} failed: ${error}`, { variant: 'error' });
        }
        closeSnackbar(key);
      }
    },
    [closeSnackbar, enqueueSnackbar, path, projectId, queryClient, uploadProjectFile],
  );

  const onDrop = useCallback(
    (acceptedFiles: File[], rejections: FileRejection[]) => {
      // Upload each valid file and display updates with notistack
      for (const file of acceptedFiles) {
        uploadFile(file);
      }

      // Display rejected files and notistack errors
      for (const rejection of rejections) {
        enqueueSnackbar(`${rejection.file.name} was rejected`, { variant: 'error' });
      }
    },
    [enqueueSnackbar, uploadFile],
  );
  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    noClick: true,
    accept: allowedFileTypes ?? [],
  });

  return (
    <div
      css={css`
        position: relative;
      `}
      {...getRootProps()}
    >
      <FileHoverCover active={isDragActive} />
      <input {...getInputProps()} />
      {children(open)}
    </div>
  );
};
