import { Row, TableRow } from './types';

/**
 * Reorganises a flat array of rows into a nested structure for use in the Data-Table component.
 * @param rows Flat rows for a Data-Table component with a path that points to where the row should appear in a nested structure
 * @returns The same rows but restructured so the rows' data appears at the point in the structure given by its path
 */
export const nestRows = (rows: Row[]): TableRow[] => {
  const nested: TableRow[] = [];

  rows.forEach(({ path, ...row }) => {
    // Divide a path "/example/path/to/somewhere" into array ['example', 'path', 'to', 'somewhere']
    const parts = path.split('/').filter((subpath) => subpath.length); // Remove empty strings

    if (!parts.length) {
      // If the paths array is empty it's a root item
      nested.push({ ...row, path: '/', items: null });
    } else {
      // Find the leaf in the tree to add the file to
      const level = getPath(nested, parts);
      level.items?.push({ ...row, path: '', items: null });
    }
  });

  return nested;
};

/**
 * Recursively find/create to the leaf node specified by the path array
 * @param node Current node in the tree
 * @param path Sections of the file path
 * @returns The working sub-node
 */
const getPath = (node: TableRow[], path: string[]): TableRow => {
  // Work on the first element of the array per function call
  const [first, ...rest] = path;
  // Check that it has already been created
  let level = node.find(({ fileName }) => fileName === first);

  // Not created? Create it with a generated id and append
  if (level === undefined) {
    level = {
      fileName: first,
      items: [],
      path: first,
      fullPath: '',
      actions: {},
      immutable: false,
    };
    node.push(level);
  }
  // Base Case! This breaks the recursion when we reach a leaf
  if (!rest.length) {
    return level;
  }
  return getPath(level.items!, rest);
};

export const addFullPaths = (basePath: string, rows: TableRow[]): TableRow[] => {
  rows.forEach((row) => {
    const { path, items, fileName } = row;
    let fullPath: string;
    if (row.id) {
      fullPath = basePath + fileName;
    } else {
      fullPath = basePath + path;
    }
    row.fullPath = fullPath;
    if (items) {
      addFullPaths(basePath + path + '/', items);
    }
  });

  return rows;
};
