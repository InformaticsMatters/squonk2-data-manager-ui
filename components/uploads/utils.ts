export const mutateAtPosition = <T>(arr: T[], idx: number, val: T) => {
  const newArr = [...arr];
  newArr[idx] = val;
  return newArr;
};

const divideFileName = (fileName: string) => {
  const typeLabelParts = fileName.split('.');
  if (typeLabelParts.length === 0) {
    throw new Error('File name is empty');
  }

  return typeLabelParts;
};

/**
 * Check if the file name suggests the file is gzipped
 * @param fileName the file name. E.g. poses.sdf.gz
 * @returns True if the fileName suggests the file is gzipped
 */
export const isFileNameGzipped = (fileName: string) => {
  // ? Are there any other extensions used for gzipped files?
  return fileName.endsWith('gz');
};

/**
 * Separates a file name string into the extension and everything before.
 * It will detect if a file name uses a .gz at the end.
 * @param fileName the file name. E.g. poses.dot.sdf.gz
 * @returns The stem and extension of the file. E.g. poses.dot.sdf.gz => ['poses.dot', '.sdf.gz']
 */
export const separateFileExtensionFromFileName = (
  fileName: string,
): [stem: string, extension: string] => {
  const typeLabelParts = divideFileName(fileName);

  if (isFileNameGzipped(fileName)) {
    return [typeLabelParts.slice(0, -2).join('.'), `.${typeLabelParts.slice(-2).join('.')}`];
  }
  return [typeLabelParts.slice(0, -1).join('.'), `.${typeLabelParts.slice(-1).join('.')}`];
};

/**
 * Uses the file name to guess the mime type of the file
 */
export const getMimeFromFileName = (fileName: string, mimeLookup: { [key: string]: string }) => {
  const typeLabelParts = divideFileName(fileName);

  if (isFileNameGzipped(fileName)) {
    typeLabelParts.pop();
  }

  return mimeLookup[`.${typeLabelParts.pop()}`];
};
