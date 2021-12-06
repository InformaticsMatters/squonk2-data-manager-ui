import type { Error as DMError, FilePathFile, FilesGetResponse } from '@squonk/data-manager-client';
import { useGetFiles } from '@squonk/data-manager-client/file';

import { withPageAuthRequired } from '@auth0/nextjs-auth0/dist/frontend';
import type { AxiosError } from 'axios';
import Head from 'next/head';
import { useRouter } from 'next/router';

import { PlaintextViewer } from '../../../components/PlaintextViewer';
import { DM_API_URL } from '../../../constants';
import { useProjectBreadcrumbs } from '../../../hooks/projectPathHooks';
import { useApi } from '../../../hooks/useApi';
import { getDecompressionType } from '../../../utils/fileUtils';
import { getQueryParams } from '../../../utils/requestUtils';

type SelectDatasetVersionResult = {
  file?: FilePathFile;
  isSelectError: boolean;
  selectError?: Error;
};

const selectProjectVersion = (
  files?: FilesGetResponse,
  fileName?: string,
): SelectDatasetVersionResult => {
  if (!files) {
    return { isSelectError: false };
  }

  const file = files.files.find((file) => file.file_name === fileName);

  if (!file) {
    return {
      isSelectError: true,
      selectError: new Error('No file found for the specified file ID'),
    };
  }
  return { file, isSelectError: false };
};

// 100 kB
const FILE_LIMIT_SIZE = 100_000;

/**
 * Displays plaintext viewer for a provided project file. The page is statically compiled, though
 * the content is populated in client. Firstly it parses information from provided `params`, then
 * fetches information about the project and finds the requested file. Finally it fetches a
 * limited amount of the file's content, which is then displayed. The helper function (the one
 * responsible selecting the file) is written in a declarative way. While the whole functionality
 * can be written imperatively using the `useEffect` hook, this should allows us easier potential
 * refactoring in the future.
 */
const FilePlainTextViewer = () => {
  const {
    query: { projectId, file: fileName },
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

  const { file, isSelectError, selectError } = selectProjectVersion(files, fileName as string);

  const decompress = file && getDecompressionType(file.file_name);
  const fileSizeLimit = FILE_LIMIT_SIZE;

  const {
    data: fileContents,
    isLoading: isContentsLoading,
    isError: isContentsError,
    error: contentsAxiosError,
  } = useApi<string>(
    `/project/${projectId}/file${getQueryParams({
      decompress,
      fileSizeLimit,
      path: dirPath,
      file: fileName,
    })}`,
    undefined,
    {
      enabled: Boolean(file),
    },
  );
  const contentsError = contentsAxiosError && new Error(contentsAxiosError.response?.data.error);

  const isLoading = isFilesLoading || isContentsLoading;
  const isError = isFilesError || isSelectError || isContentsError;
  const error = filesError || selectError || contentsError;

  const downloadUrl = `${DM_API_URL}/project/${projectId}/file${getQueryParams({
    path: dirPath,
    file: fileName,
  })}`;

  return (
    <>
      <Head>
        <title>File Plaintext Viewer</title>
      </Head>
      <PlaintextViewer
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
