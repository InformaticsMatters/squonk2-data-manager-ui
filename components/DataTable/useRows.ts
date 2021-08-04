import { useMemo } from 'react';

import type { FilesGetResponse } from '@squonk/data-manager-client';

import type { TableDir, TableFile } from './types';

export const useRows = (breadcrumbs: string[], data?: FilesGetResponse) => {
  const rows = useMemo(() => {
    const getFullPath = (path: string[], fileName: string) => {
      if (path.length > 0) {
        return path.join('/') + '/' + fileName;
      }
      return fileName;
    };

    const files: TableFile[] | undefined = data?.files.map((file) => {
      const { file_id: fileId, file_name: fileName, owner, immutable } = file;

      const fullPath = getFullPath(breadcrumbs, fileName);

      return {
        fileName,
        fullPath,
        file_id: fileId,
        owner,
        immutable,
      };
    });

    const dirs: TableDir[] | undefined = data?.paths.map((path) => {
      const fullPath = getFullPath(breadcrumbs, path);

      return {
        fileName: path,
        fullPath,
        path,
      };
    });

    return dirs && files ? [...dirs, ...files] : undefined;
  }, [data, breadcrumbs]);

  return rows;
};
