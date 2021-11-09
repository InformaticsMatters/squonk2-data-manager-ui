import type { FileInfoChip } from './types';

export const useGetFileInfoChips = (decompress: boolean, fileSizeLimit: boolean) => {
  const chips: FileInfoChip[] = [];

  if (decompress) {
    chips.push({
      label: 'Decompressed',
      description: 'The file has been decompressed in order to display its contents',
    });
  }

  if (fileSizeLimit) {
    chips.push({ label: 'Limited view', description: 'Only part of the file is being displayed' });
  }

  return chips;
};
