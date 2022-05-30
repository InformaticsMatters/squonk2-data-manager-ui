import type { FileInfoChip } from "./types";

/**
 * Creates data for Chips which displays information about a displayed content.
 */
export const useGetFileInfoChips = (
  transferredSize: number,
  fileSizeLimit?: number,
  decompress?: string,
) => {
  const chips: FileInfoChip[] = [];

  if (decompress !== undefined) {
    chips.push({
      label: "Decompressed",
      description: "The file has been decompressed in order to display its contents",
    });
  }

  // Only display the 'Limited view' badge if the transferred size is equal or exceeds the size
  // limit
  if (fileSizeLimit && transferredSize >= fileSizeLimit) {
    chips.push({ label: "Limited view", description: "Only part of the file is being displayed" });
  }

  return chips;
};
