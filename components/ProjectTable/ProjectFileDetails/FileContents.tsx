import type { Error as DMError } from '@squonk/data-manager-client';
import { useDownloadFile } from '@squonk/data-manager-client/file';

import { Alert } from '@material-ui/lab';
import type { AxiosError } from 'axios';

import { CenterLoader } from '../../CenterLoader';

export interface FileContentsProps {
  fileId: string;
}

export const FileContents = ({ fileId }: FileContentsProps) => {
  const { data, isLoading, isError, error } = useDownloadFile<string, AxiosError<DMError>>(fileId);

  if (isLoading) {
    return <CenterLoader />;
  }

  if (isError) {
    return <Alert severity="error">{error?.response?.data.error || 'test'}</Alert>;
  }

  return <pre>{data}</pre>;
};
