import { withPageAuthRequired } from '@auth0/nextjs-auth0/dist/frontend';
import Head from 'next/head';
import { useRouter } from 'next/router';

import { PlainTextViewer } from '../../components/PlainTextView';
import { useApi } from '../../hooks/useApi';
import { DM_API_URL } from '../../utils/baseUrls';

const FilePlainTextViewer = () => {
  const { asPath, query } = useRouter();
  const { data, isLoading, isError, error } = useApi<string>(asPath);

  const { decompress, fileSizeLimit, fileId } = query;

  const downloadUrl = `${DM_API_URL}/file/${fileId}`;

  return (
    <>
      <Head>
        <title>File Plaintext Viewer</title>
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

export default withPageAuthRequired(FilePlainTextViewer);
