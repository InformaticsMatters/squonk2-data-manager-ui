import type {
  DatasetDetail,
  DatasetVersionDetail,
  Error as DMError,
} from '@squonk/data-manager-client';
import { useGetVersions } from '@squonk/data-manager-client/dataset';

import { withPageAuthRequired } from '@auth0/nextjs-auth0/dist/frontend';
import type { AxiosError } from 'axios';
import Head from 'next/head';
import { useRouter } from 'next/router';

import { PlaintextViewer } from '../../../components/PlaintextViewer';
import { useApi } from '../../../hooks/useApi';
import { DM_API_URL } from '../../../utils/baseUrls';
import { getQueryParams } from '../../../utils/requestUtils';

type ParseDatasetVersionResult = {
  datasetVersionNumber?: number;
  isParseError: boolean;
  parseError?: Error;
};

type SelectDatasetVersionResult = {
  version?: DatasetVersionDetail;
  isSelectError: boolean;
  selectError?: Error;
};

const parseDatasetVersion = (datasetVersion?: string | string[]): ParseDatasetVersionResult => {
  const datasetVersionParsed = parseInt(datasetVersion as string);
  if (isNaN(datasetVersionParsed)) {
    return {
      isParseError: true,
      parseError: new Error('Invalid dataset version number was specified'),
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
      selectError: new Error('No dataset version found for the specified dataset version number'),
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
    error: datasetDetailAxiosError,
  } = useGetVersions<DatasetDetail, AxiosError<DMError>>(datasetId as string, undefined, {
    query: { enabled: !isParseError },
  });
  const datasetDetailError =
    datasetDetailAxiosError && new Error(datasetDetailAxiosError.response?.data.error);

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
    error: contentsAxiosError,
  } = useApi<string>(
    `/dataset/${datasetId}/${datasetVersion}/${getQueryParams({ decompress, fileSizeLimit })}`,
    undefined,
    {
      enabled: Boolean(version),
    },
  );
  const contentsError = contentsAxiosError && new Error(contentsAxiosError.response?.data.error);

  const isLoading = isDatasetDetailLoading || isContentsLoading;
  const isError = isParseError || isDatasetDetailError || isSelectError || isContentsError;
  const error = parseError || datasetDetailError || selectError || contentsError;

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
