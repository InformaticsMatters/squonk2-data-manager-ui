import { useMemo } from "react";

import type { FilePathFile } from "@squonk/data-manager-client";
import { useGetFiles } from "@squonk/data-manager-client/file-and-path";

import { useProjectBreadcrumbs } from "../../hooks/projectPathHooks";
import { separateFileExtensionFromFileName } from "../../utils/app/files";
import type { TableDir, TableFile } from "./types";

const getFullPath = (path: string[], fileName: string) => {
  if (path.length > 0) {
    return path.join("/") + "/" + fileName;
  }
  return fileName;
};

const NESTING_EXTENSIONS = [".schema.json", ".meta.json"];

const filePathFileToTableFile = (file: FilePathFile, breadcrumbs: string[]): TableFile => {
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
    subRows: [],
  };
};

export const useProjectFileRows = (project_id: string) => {
  // Breadcrumbs
  const breadcrumbs = useProjectBreadcrumbs();
  const dirPath = "/" + breadcrumbs.join("/");

  const { data, error, isError, isLoading } = useGetFiles({
    project_id,
    path: dirPath,
  });

  const dataFiles = data?.files;
  const paths = data?.paths;

  const rows = useMemo(() => {
    // split the schema files from the rest
    // and reshape all files to the format we need
    const nestedFiles = dataFiles
      ?.filter((file) => NESTING_EXTENSIONS.some((ext) => file.file_name.endsWith(ext)))
      .map((file) => filePathFileToTableFile(file, breadcrumbs));

    const topLevelFiles = dataFiles
      ?.filter((file) => !NESTING_EXTENSIONS.some((ext) => file.file_name.endsWith(ext)))
      .map((file) => filePathFileToTableFile(file, breadcrumbs));

    // group sub items under the main files (e.g. file.schema.json nested under file.sdf)
    const files: TableFile[] | undefined = topLevelFiles?.map((file) => {
      const [stem] = separateFileExtensionFromFileName(file.fileName);

      // this will duplicate files under multiple parents for now
      // hopefully the NESTING_EXTENSIONS becomes sufficiently strict that this is not an issue
      const subRows = nestedFiles
        ?.filter((nestedFile) => nestedFile.fileName.startsWith(stem))
        .map((file) => ({ ...file, subRows: [] }));

      file.subRows = subRows ?? [];

      return file;
    });

    // Then get together all the directories
    const dirs: TableDir[] | undefined = paths?.map((path) => {
      const fullPath = getFullPath(breadcrumbs, path);

      return {
        fileName: path,
        fullPath,
        path,
      };
    });

    // If we have both, concat them with the dirs first
    return dirs && files ? [...dirs, ...files] : undefined;
  }, [dataFiles, paths, breadcrumbs]);

  return { rows, error, isError, isLoading };
};
