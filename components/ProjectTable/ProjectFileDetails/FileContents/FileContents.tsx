import { css } from '@emotion/react';
import { Typography } from '@material-ui/core';
import { Alert } from '@material-ui/lab';

import { useDownloadContents } from '../../../../hooks/useDownloadContents';
import { CenterLoader } from '../../../CenterLoader';

export interface FileContentsProps {
  /**
   * ID of the file. This is used to retrieve file's contents.
   */
  fileId: string;
  /**
   * Name of the file. Used to determine whether or not to decompress the file.
   */
  fileName: string;
}

/**
 * Displays file's contents.
 */
export const FileContents = ({ fileId, fileName }: FileContentsProps) => {
  const { data, isLoading, isError, error } = useDownloadContents(fileId, fileName);

  if (isLoading) {
    return <CenterLoader />;
  }

  if (isError) {
    return <Alert severity="error">{error?.response?.data.error}</Alert>;
  }

  return (
    <Typography
      component="pre"
      css={css`
        font-family: 'Fira Mono', monospace;
      `}
    >
      {data}
    </Typography>
  );
};
