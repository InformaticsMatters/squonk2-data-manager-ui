import type { FileInfoChip } from './types';

export const useGetFileInfoChips = (
  transferredSize: number,
  fileSizeLimit?: number,
  decompress?: string,
) => {
  const chips: FileInfoChip[] = [];

  if (decompress !== undefined) {
    chips.push({
      label: 'Decompressed',
      description: 'The file has been decompressed in order to display its contents',
    });
  }

  if (fileSizeLimit && transferredSize >= fileSizeLimit) {
    chips.push({ label: 'Limited view', description: 'Only part of the file is being displayed' });
  }

  return chips;
};
