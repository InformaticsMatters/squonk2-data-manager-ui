export const getDecompressionType = (fileName: string) => {
  // Currently the proper compression is decided based on file extension
  // For .gz files we can use 'unzip' strategy which determines whether to use 'inflate' or 'gunzip'
  if (fileName.endsWith('.gz')) {
    return 'unzip';
  } else if (fileName.endsWith('.br')) {
    return 'brotli';
  }
  return undefined;
};
