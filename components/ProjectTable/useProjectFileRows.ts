import { useMemo } from 'react';

import { useGetFiles } from '@squonk/data-manager-client/file';

import { useProjectBreadcrumbs } from '../../hooks/projectPathHooks';
import type { TableDir, TableFile } from './types';

const getFullPath = (path: string[], fileName: string) => {
  if (path.length > 0) {
    return path.join('/') + '/' + fileName;
  }
  return fileName;
};

export const useProjectFileRows = (project_id: string) => {
  // Breadcrumbs
  const breadcrumbs = useProjectBreadcrumbs();
  const dirPath = '/' + breadcrumbs.join('/');

  const { data, error, isError, isLoading } = useGetFiles({
    project_id,
    path: dirPath,
  });

  const rows = useMemo(() => {
    const files: TableFile[] | undefined = data?.files.map((file) => {
      const { file_id: fileId, file_name: fileName, owner, immutable, mime_type, stat } = file;

      const fullPath = getFullPath(breadcrumbs, fileName);

      return {
        fileName,
        fullPath,
        file_id: fileId,
        owner,
        immutable,
        mime_type,
        stat,
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

  return { rows, error, isError, isLoading };
};
