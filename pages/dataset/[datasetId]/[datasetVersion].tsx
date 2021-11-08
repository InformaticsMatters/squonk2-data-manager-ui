import { withPageAuthRequired } from '@auth0/nextjs-auth0/dist/frontend';
import { useRouter } from 'next/router';

import { PlainTextViewer } from '../../../components/PlainTextView';
import { useApi } from '../../../hooks/useApi';

const DatasetVersionPlainTextViewer = () => {
  const { asPath, query } = useRouter();
  const { data, isLoading, isError, error } = useApi<string>(asPath);

  const { decompress, fileSizeLimit } = query;

  return (
    <PlainTextViewer
      data={data}
      decompress={decompress}
      error={error}
      fileSizeLimit={fileSizeLimit}
      isError={isError}
      isLoading={isLoading}
    />
  );
};

export default withPageAuthRequired(DatasetVersionPlainTextViewer);
