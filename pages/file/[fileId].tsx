import { withPageAuthRequired } from '@auth0/nextjs-auth0/dist/frontend';
import Head from 'next/head';
import { useRouter } from 'next/router';

import { PlainTextViewer } from '../../components/PlainTextView';
import { useApi } from '../../hooks/useApi';
import { DM_API_URL } from '../../utils/baseUrls';
import { getQueryParams } from '../../utils/requestUtils';

const FilePlainTextViewer = () => {
  const {
    asPath,
    query: { fileId },
  } = useRouter();

  const decompress = 'unzip';
  const fileSizeLimit = 1_000_000; // 1 MB

  const { data, isLoading, isError, error } = useApi<string>(
    `${asPath}${getQueryParams({ decompress, fileSizeLimit })}`,
  );

  const downloadUrl = `${DM_API_URL}/file/${fileId}`;

  return (
    <>
      <Head>
        <title>File Plaintext Viewer</title>
      </Head>
      <PlainTextViewer
        content={data}
        decompress={decompress}
        downloadUrl={downloadUrl}
        error={error}
        fileSizeLimit={fileSizeLimit}
        isError={isError}
        isLoading={isLoading}
        title=""
      />
    </>
  );
};

export default withPageAuthRequired(FilePlainTextViewer);
