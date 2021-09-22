import type { TableDir, TableFile } from './types';

type Row = TableDir | TableFile;

export const isTableDir = (row: Row): row is TableDir => {
  if (Object.prototype.hasOwnProperty.call(row, 'path')) {
    return true;
  }
  return false;
};
