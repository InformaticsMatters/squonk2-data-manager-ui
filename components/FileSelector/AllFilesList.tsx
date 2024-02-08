import { useState } from "react";

import { useGetFiles } from "@squonk/data-manager-client/file-and-path";

import { Typography } from "@mui/material";

import { CenterLoader } from "../CenterLoader";
import { FileListItem } from "./FileListItem";
import { PathBreadcrumbs } from "./PathBreadcrumbs";
import { ScrollList } from "./ScrollList";
import type { FileOrDirectory, SharedProps } from "./types";
import { getChecked, getFullPath, getNewValue } from "./utils";

/**
 * Navigable list of files in the project volume in a list format with options to select files or
 * directories
 */
export const AllFilesList = ({
  projectId,
  value,
  targetType,
  onSelect,
  multiple,
  mimeTypes,
}: SharedProps) => {
  const [breadcrumbs, setBreadcrumbs] = useState<string[]>([]);
  const subPath = "/" + breadcrumbs.join("/");

  const { data, isLoading } = useGetFiles({
    project_id: projectId,
    path: subPath,
  });

  const files =
    data?.files.filter((file) => !file.mime_type || mimeTypes?.includes(file.mime_type)) ?? [];
  const dirs = data?.paths ?? [];

  const handleSelect = (fullPath: string) => (checked: boolean) =>
    onSelect(getNewValue(fullPath, checked, multiple, value));

  const items = [
    ...dirs
      .map((path) => {
        const fullPath = getFullPath(breadcrumbs, path);
        const type: FileOrDirectory = "directory";
        return {
          fullPath,
          key: fullPath,
          mimeType: undefined,
          title: path,
          type,
          onClick: () => setBreadcrumbs([...breadcrumbs, path]),
          onSelect: targetType.startsWith("dir") ? handleSelect(fullPath) : undefined,
        };
      })
      .sort((dirA, dirB) => dirA.title.localeCompare(dirB.title)),
    ...files
      .map((file) => {
        const fullPath = getFullPath(breadcrumbs, file.file_name);
        const type: FileOrDirectory = "file";
        return {
          fullPath,
          mimeType: file.mime_type,
          title: file.file_name,
          type,
          onSelect: handleSelect(fullPath),
        };
      })
      .sort((fileA, fileB) => fileA.title.localeCompare(fileB.title)),
  ];

  if (isLoading) {
    return (
      <>
        <PathBreadcrumbs breadcrumbs={breadcrumbs} setBreadcrumbs={setBreadcrumbs} />
        <CenterLoader />
      </>
    );
  }

  if (items.length === 0) {
    return (
      <>
        <PathBreadcrumbs breadcrumbs={breadcrumbs} setBreadcrumbs={setBreadcrumbs} />
        <Typography align="center" variant="body2">
          No files or directories
        </Typography>
      </>
    );
  }

  return (
    <>
      <PathBreadcrumbs breadcrumbs={breadcrumbs} setBreadcrumbs={setBreadcrumbs} />
      <ScrollList dense>
        {items
          .filter((item) => (targetType.startsWith("dir") ? item.type === "directory" : true))
          .map((item) => (
            <FileListItem
              key={item.fullPath}
              {...item}
              checked={getChecked(value, item.fullPath)}
              projectId={projectId}
            />
          ))}
      </ScrollList>
    </>
  );
};
