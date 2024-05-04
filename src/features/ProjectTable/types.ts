import { type FilePathFile } from "@squonk/data-manager-client";

/**
 * Root relative path separated by forward slashes including the file name at the end
 */
type FullPath = string;

interface BaseTableRow {
  /**
   * All files and directories must have a name to uniquely identify them within their parent
   * directory
   */
  fileName: string;
}

// Properties of files only
interface BaseTableFile extends Omit<FilePathFile, "file_name"> {
  fullPath: FullPath;
  subRows: TableFile[];
}

export type TableFile = BaseTableFile & BaseTableRow;

// Properties of folders only
interface BaseTableDir extends BaseTableRow {
  fullPath: FullPath;
  path: string;
  owner?: never;
}

export type TableDir = BaseTableDir & BaseTableRow;
