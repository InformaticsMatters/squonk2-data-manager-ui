import type { Row, TableDataset, TableDir, TableFile } from './types';

export const isTableFile = (row: Row): row is TableFile => {
  if (Object.prototype.hasOwnProperty.call(row, 'actions')) {
    if (Object.prototype.hasOwnProperty.call((row as TableFile | TableDir).actions, 'projectId')) {
      return true;
    }
  }
  return false;
};

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
