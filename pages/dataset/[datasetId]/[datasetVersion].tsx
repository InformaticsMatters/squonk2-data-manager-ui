import type { DatasetDetail, DatasetVersionDetail } from '@squonk/data-manager-client';
import { useGetVersions } from '@squonk/data-manager-client/dataset';

import { withPageAuthRequired } from '@auth0/nextjs-auth0/dist/frontend';
import Head from 'next/head';
import { useRouter } from 'next/router';

import { PlaintextViewer } from '../../../components/PlaintextViewer';
import { DM_API_URL } from '../../../constants';
import { APP_ROUTES } from '../../../constants/routes';
import { useApi } from '../../../hooks/useApi';
import { getErrorMessage } from '../../../utils/orvalError';
import { getQueryParams } from '../../../utils/requestUtils';

type ParseDatasetVersionResult = {
  datasetVersionNumber?: number;
  isParseError: boolean;
  parseError?: string;
};

type SelectDatasetVersionResult = {
  version?: DatasetVersionDetail;
  isSelectError: boolean;
  selectError?: string;
};

const parseDatasetVersion = (datasetVersion?: string | string[]): ParseDatasetVersionResult => {
  const datasetVersionParsed = parseInt(datasetVersion as string);
  if (isNaN(datasetVersionParsed)) {
    return {
      isParseError: true,
      parseError: 'Invalid dataset version number provided',
    };
  }
  return { datasetVersionNumber: datasetVersionParsed, isParseError: false };
};

const selectDatasetVersion = (
  datasetDetail?: DatasetDetail,
  datasetVersion?: number,
): SelectDatasetVersionResult => {
  // If `datasetDetail` is not provided, don't return a version, nor an error
  if (!datasetDetail) {
    return { isSelectError: false };
  }

  const version = datasetDetail.versions.find((version) => version.version === datasetVersion);

  if (!version) {
    return {
      isSelectError: true,
      selectError: 'No dataset version found for the specified dataset version number',
    };
  }
  return { version, isSelectError: false };
};

// Datasets are always gziped as of now
const DECOMPRESS = 'unzip';
// 100 kB
const FILE_LIMIT_SIZE = 100_000;

/**
 * Displays plaintext viewer for a provided dataset version. The page is statically compiled, though
 * the content is populated in client. Firstly it parses information from provided `params`, then
 * fetches information about the dataset and finds the requested version. Finally it fetches a
 * limited amount of the version's content, which is then displayed. The helper functions (the ones
 * responsible for parsing `params` and selecting the version) are written in a declarative way.
 * While the whole functionality can be written imperatively using the `useEffect` hook, this should
 * allows us easier potential refactoring in the future.
 */
const DatasetVersionPlainTextViewer = () => {
  const { query } = useRouter();
  const { datasetId, datasetVersion } = query;

  const { datasetVersionNumber, isParseError, parseError } = parseDatasetVersion(datasetVersion);

  const {
    data: datasetDetail,
    isLoading: isDatasetDetailLoading,
    isError: isDatasetDetailError,
    error: datasetDetailError,
  } = useGetVersions(datasetId as string, undefined, {
    query: { enabled: !isParseError },
  });

  const { version, isSelectError, selectError } = selectDatasetVersion(
    datasetDetail,
    datasetVersionNumber,
  );

  const decompress = DECOMPRESS;
  const fileSizeLimit = FILE_LIMIT_SIZE;

  const {
    data: fileContents,
    isLoading: isContentsLoading,
    isError: isContentsError,
    error: contentsError,
  } = useApi<string>(
    `${APP_ROUTES.dataset['.']}/${datasetId}/${datasetVersion}/${getQueryParams({
      decompress,
      fileSizeLimit,
    })}`,
    undefined,
    {
      enabled: Boolean(version),
    },
  );

  const isLoading = isDatasetDetailLoading || isContentsLoading;
  const isError = isParseError || isDatasetDetailError || isSelectError || isContentsError;
  const error =
    parseError ||
    getErrorMessage(datasetDetailError) ||
    selectError ||
    getErrorMessage(contentsError);

  const downloadUrl = `${DM_API_URL}/dataset/${datasetId}/${datasetVersion}`;

  return (
    <>
      <Head>
        <title>Dataset Plaintext Viewer</title>
      </Head>
      <PlaintextViewer
        content={fileContents}
        decompress={decompress}
        downloadUrl={downloadUrl}
        error={error}
        fileSizeLimit={fileSizeLimit}
        isError={isError}
        isLoading={isLoading}
        title={version?.file_name ?? ''}
      />
    </>
  );
};

export default withPageAuthRequired(DatasetVersionPlainTextViewer);
