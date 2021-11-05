import { useApi } from '../../../../hooks/useApi';
import { getQueryParams } from '../../../../utils/requestUtils';

const getDecompressionType = (fileName: string) => {
  // Currently the proper compression is decided based on file extension
  // For .gz files we can use 'unzip' strategy which determines whether to use 'inflate' or 'gunzip'
  if (fileName.endsWith('.gz')) {
    return 'unzip';
  } else if (fileName.endsWith('.br')) {
    return 'brotli';
  }
  return undefined;
};

export const useFileContents = (fileId: string, fileName: string) => {
  const params = {
    // In case the file is compressed, get its compression format and send it with the request
    decompress: getDecompressionType(fileName),
    fileSizeLimit: 1000, // 1MB
  };
  return useApi<string>(`/file/${fileId}${getQueryParams(params)}`);
};
