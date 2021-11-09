import { withPageAuthRequired } from '@auth0/nextjs-auth0/dist/frontend';
import Head from 'next/head';
import { useRouter } from 'next/router';

import { PlainTextViewer } from '../../../components/PlainTextView';
import { useApi } from '../../../hooks/useApi';
import { DM_API_URL } from '../../../utils/baseUrls';

const DatasetVersionPlainTextViewer = () => {
  const { asPath, query } = useRouter();
  const { data, isLoading, isError, error } = useApi<string>(asPath);

  const { decompress, fileSizeLimit, datasetId, datasetVersion } = query;

  const downloadUrl = `${DM_API_URL}/datasets/${datasetId}/${datasetVersion}`;

  return (
    <>
      <Head>
        <title>Dataset Plaintext Viewer</title>
      </Head>
      <PlainTextViewer
        data={data}
        decompress={Boolean(decompress)}
        downloadUrl={downloadUrl}
        error={error}
        fileSizeLimit={Boolean(fileSizeLimit)}
        isError={isError}
        isLoading={isLoading}
      />
    </>
  );
};

export default withPageAuthRequired(DatasetVersionPlainTextViewer);
