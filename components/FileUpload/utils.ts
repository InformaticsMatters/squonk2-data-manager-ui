export const getMimeType = (fileName: string) => {
  const parts = fileName.split('.');

  if (parts.includes('sdf')) {
    return 'chemical/x-mdl-sdfile';
  } else if (parts.includes('pdb')) {
    return 'chemical/x-pdb';
  }
  return 'text/plain';
};

export const mutateAtPosition = <T extends unknown>(arr: T[], idx: number, val: T) => {
  const newArr = [...arr];
  newArr[idx] = val;
  return newArr;
};

export const allowedFileTypes = ['.sdf', '.pdb'].map((s) => [s, `${s}.gz`]).flat();
