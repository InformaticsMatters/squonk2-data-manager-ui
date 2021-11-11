/**
 * Gets decompression type based on a file's name. The type is derived from the file's extension.
 */
export const getDecompressionType = (fileName: string) => {
  // For .gz files we can use 'unzip' strategy which determines whether to use 'inflate' or 'gunzip'
  if (fileName.endsWith('.gz')) {
    return 'unzip';
  } else if (fileName.endsWith('.br')) {
    return 'brotli';
  }
  return undefined;
};
