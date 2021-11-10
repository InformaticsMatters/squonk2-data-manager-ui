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

import { PlainTextViewer } from '../../../components/PlainTextView';
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
  datasetVersions?: DatasetDetail,
  datasetVersion?: number,
): SelectDatasetVersionResult => {
  if (!datasetVersions) {
    return { isSelectError: false };
  }

  const version = datasetVersions.versions.find((version) => version.version === datasetVersion);

  if (!version) {
    return {
      isSelectError: true,
      selectError: new Error('No dataset version found for the specified dataset version number'),
    };
  }
  return { version, isSelectError: false };
};

const DatasetVersionPlainTextViewer = () => {
  const { asPath, query } = useRouter();
  const { datasetId, datasetVersion } = query;

  const { datasetVersionNumber, isParseError, parseError } = parseDatasetVersion(datasetVersion);

  const {
    data: datasetVersions,
    isLoading: isVersionsLoading,
    isError: isVersionsError,
    error: versionsAxiosError,
  } = useGetVersions<DatasetDetail, AxiosError<DMError>>(datasetId as string, undefined, {
    query: { enabled: !isParseError },
  });
  const versionsError = versionsAxiosError && new Error(versionsAxiosError.response?.data.error);

  const { version, isSelectError, selectError } = selectDatasetVersion(
    datasetVersions,
    datasetVersionNumber,
  );

  //const decompress = version && getDecompressionType(version.source_ref);
  const decompress = 'unzip';
  const fileSizeLimit = 1_000_000; // 1 MB

  const {
    data: fileContents,
    isLoading: isContentsLoading,
    isError: isContentsError,
    error: contentsAxiosError,
  } = useApi<string>(`${asPath}${getQueryParams({ decompress, fileSizeLimit })}`, undefined, {
    enabled: Boolean(version),
  });
  const contentsError = contentsAxiosError && new Error(contentsAxiosError.response?.data.error);

  const isLoading = isVersionsLoading || isContentsLoading;
  const isError = isParseError || isVersionsError || isSelectError || isContentsError;
  const error = parseError || versionsError || selectError || contentsError;

  const downloadUrl = `${DM_API_URL}/dataset/${datasetId}/${datasetVersion}`;

  return (
    <>
      <Head>
        <title>Dataset Plaintext Viewer</title>
      </Head>
      <PlainTextViewer
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
