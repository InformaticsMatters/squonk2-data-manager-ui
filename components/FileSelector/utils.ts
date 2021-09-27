/**
 * Determines whether an item is currently selected
 * @param value the current selection value
 * @param fullPath the path of the item to check
 * @returns whether the item is currently selected
 */
export const getChecked = (value: string[] | string | undefined, fullPath: string): boolean =>
  !!(fullPath === value || (typeof value !== 'string' && value?.includes(fullPath)));

/**
 * Gets the root relative path to the file or directory
 * @param breadcrumbs array of directory names
 * @param path file name or directory
 * @returns the generated path
 */
export const getFullPath = (breadcrumbs: string[], path: string): string =>
  breadcrumbs.join('/') + (breadcrumbs.length ? '/' : '') + path;

/**
 * Determines the new value of the selection
 * @param fullPath path of the item
 * @param checked the selection state of the item
 * @param multiple whether more than one item can be selected
 * @param value the current selection value
 * @returns the new value for the selection
 */
export const getNewValue = (
  fullPath: string,
  checked: boolean,
  multiple: boolean,
  value: string[] | string | undefined,
): string | string[] | undefined => {
  if (multiple) {
    if (value === undefined) {
      // Case: no files selected
      if (checked) {
        return [fullPath];
      }
      return undefined;
    }

    if (checked) {
      // Case: file is selected, add it if it doesn't already exist
      return Array.from(new Set([...[value].flat(), fullPath]));
    }

    // Case: file is deselected, remove it
    return [value].flat().filter((p) => p !== fullPath);
  }

  return checked ? fullPath : undefined;
};
