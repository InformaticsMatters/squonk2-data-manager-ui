import type { TableDataset, TableDir, TableFile } from './types';

type Row = TableDataset | TableDir | TableFile;

export const isTableDir = (row: Row): row is TableDir => {
  if (Object.prototype.hasOwnProperty.call(row, 'path')) {
    return true;
  }
  return false;
};

export const isDataset = (row: Row): row is TableDataset => {
  if (Object.prototype.hasOwnProperty.call(row, 'editors')) {
    return true;
  }
  return false;
};
