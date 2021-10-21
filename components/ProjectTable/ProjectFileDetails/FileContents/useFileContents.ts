import { useApi } from '../../../../hooks/useApi';

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

const getDecompressionQuery = (fileName: string) => {
  const type = getDecompressionType(fileName);
  return type ? `?decompress=${type}` : '';
};

export const useFileContents = (fileId: string, fileName: string) => {
  // In case the file is compressed, get its compression format and send it with the request
  const decompress = getDecompressionQuery(fileName);
  return useApi<string>(`/file/${fileId}${decompress}`);
};
