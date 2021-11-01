export const mutateAtPosition = <T>(arr: T[], idx: number, val: T) => {
  const newArr = [...arr];
  newArr[idx] = val;
  return newArr;
};

export const getMimeFromFileName = (fileName: string, mimeLookup: { [key: string]: string }) => {
  const typeLabelParts = fileName.split('.');
  const [, ...extensions] = typeLabelParts;

  return mimeLookup[`.${extensions.join('.')}`];
};
