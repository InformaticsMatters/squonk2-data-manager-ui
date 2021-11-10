import type { Error as DMError, FilePathFile, FilesGetResponse } from '@squonk/data-manager-client';
import { useGetFiles } from '@squonk/data-manager-client/file';

import { withPageAuthRequired } from '@auth0/nextjs-auth0/dist/frontend';
import type { AxiosError } from 'axios';
import Head from 'next/head';
import { useRouter } from 'next/router';

import { PlainTextViewer } from '../../components/PlainTextView';
import { useProjectBreadcrumbs } from '../../hooks/projectPathHooks';
import { useApi } from '../../hooks/useApi';
import { DM_API_URL } from '../../utils/baseUrls';
import { getQueryParams } from '../../utils/requestUtils';

type SelectDatasetVersionResult = {
  file?: FilePathFile;
  isSelectError: boolean;
  selectError?: Error;
};

const selectProjectVersion = (
  files?: FilesGetResponse,
  fileId?: string,
): SelectDatasetVersionResult => {
  if (!files) {
    return { isSelectError: false };
  }

  const file = files.files.find((file) => file.file_id === fileId);

  if (!file) {
    return {
      isSelectError: true,
      selectError: new Error('No file found for the specified file ID'),
    };
  }
  return { file, isSelectError: false };
};

const FilePlainTextViewer = () => {
  const {
    query: { project: projectId, fileId },
  } = useRouter();

  const breadcrumbs = useProjectBreadcrumbs();
  const dirPath = '/' + breadcrumbs.join('/');

  const {
    data: files,
    isLoading: isFilesLoading,
    isError: isFilesError,
    error: filesAxiosError,
  } = useGetFiles<FilesGetResponse, AxiosError<DMError> | void>({
    project_id: projectId as string,
    path: dirPath,
  });
  const filesError = filesAxiosError && new Error(filesAxiosError.response?.data.error);

  const { file, isSelectError, selectError } = selectProjectVersion(files, fileId as string);

  const decompress = 'unzip';
  const fileSizeLimit = 1_000_000; // 1 MB

  const {
    data: fileContents,
    isLoading: isContentsLoading,
    isError: isContentsError,
    error: contentsAxiosError,
  } = useApi<string>(`/file/${fileId}${getQueryParams({ decompress, fileSizeLimit })}`, undefined, {
    enabled: Boolean(file),
  });
  const contentsError = contentsAxiosError && new Error(contentsAxiosError.response?.data.error);

  const isLoading = isFilesLoading || isContentsLoading;
  const isError = isFilesError || isSelectError || isContentsError;
  const error = filesError || selectError || contentsError;

  const downloadUrl = `${DM_API_URL}/file/${fileId}`;

  return (
    <>
      <Head>
        <title>File Plaintext Viewer</title>
      </Head>
      <PlainTextViewer
        content={fileContents}
        decompress={decompress}
        downloadUrl={downloadUrl}
        error={error}
        fileSizeLimit={fileSizeLimit}
        isError={isError}
        isLoading={isLoading}
        title={file?.file_name ?? ''}
      />
    </>
  );
};

export default withPageAuthRequired(FilePlainTextViewer);
