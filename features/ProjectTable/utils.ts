import { type TableDir, type TableFile } from "./types";

type Row = TableDir | TableFile;

/**
 * Tests whether an input is a file or directory
 * @param row the file or directory to check
 * @returns whether the input is a directory
 */
export const isTableDir = (row: Row): row is TableDir => {
  if (Object.prototype.hasOwnProperty.call(row, "path")) {
    return true;
  }
  return false;
};
