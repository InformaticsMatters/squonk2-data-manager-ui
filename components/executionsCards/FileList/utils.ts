export const getChecked = (value: string[] | string | undefined, fullPath: string) => {
  return !!(fullPath === value || (typeof value !== 'string' && value?.includes(fullPath)));
};

export const getNewValue = (
  fullPath: string,
  checked: boolean,
  multiple: boolean,
  value: string[] | string | undefined,
) => {
  if (multiple) {
    if (value === undefined) {
      if (checked) {
        return [fullPath];
      }
      return undefined;
    }
    if (checked) {
      return Array.from(new Set([...[value].flat(), fullPath]));
    }
    return [value].flat().filter((p) => p !== fullPath);
  }
  return checked ? fullPath : undefined;
};

export const getFullPath = (breadcrumbs: string[], path: string) =>
  breadcrumbs.join('/') + (breadcrumbs.length ? '/' : '') + path;
