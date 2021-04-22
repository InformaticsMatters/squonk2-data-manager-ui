import { Row, TableRow } from './types';

let currentId = 0;

const getNewId = () => {
  // We could use a fancier solution instead of a sequential ID
  return ++currentId;
};

/**
 * Reorganises a flat array of rows into a nested structure for use in the Data-Table component.
 * @param rows Flat rows for a Data-Table component with a path that points to where the row should appear in a nested structure
 * @returns The same rows but restructured so the rows' data appears at the point in the structure given by its path
 */
export const nestRows = (rows: Row[]): TableRow[] => {
  const nested: TableRow[] = [];

  rows.forEach(({ path, ...row }) => {
    // Divide a path "/example/path/to/somewhere" into array ['example', 'path', 'to', 'somewhere']
    const parts = path?.split('/').filter((subpath) => subpath.length) ?? [];

    // Check for root items
    if (!parts.length) {
      nested.push({ ...row, path: '', items: null });
    } else {
      // Find the leaf in the tree to add the file to
      const level = getPath(nested, parts);
      level.items.push({ ...row });
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
const getPath = (node: TableRow[], path: string[]): any => {
  // Work on the first element of the array per function call
  const [first, ...rest] = path;
  // Check that it has already been created
  let level = node.find(({ fileName }) => fileName === first);

  // Not created? Create it with a generated id and append
  if (level === undefined) {
    level = {
      items: [] as TableRow[],
      fileName: first,
      path: '',
      id: getNewId().toString(),
      actions: {},
    };
    node.push(level as TableRow);
  }
  // Base Case! This breaks the recursion when we reach a leaf
  if (!rest.length) {
    return level;
  }
  return getPath((level as TableRow).items as TableRow[], rest);
};
