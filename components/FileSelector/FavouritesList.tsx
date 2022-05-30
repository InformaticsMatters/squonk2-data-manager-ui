import FolderSpecialRoundedIcon from "@mui/icons-material/FolderSpecialRounded";
import { Typography } from "@mui/material";

import { useSelectedFiles } from "../../context/fileSelectionContext";
import { FileListItem } from "./FileListItem";
import { ScrollList } from "./ScrollList";
import type { SharedProps } from "./types";
import { getChecked, getNewValue } from "./utils";

/**
 * List of favourited files with option to select them on click.
 */
export const FavouritesList = ({
  projectId,
  value,
  mimeTypes,
  targetType,
  multiple,
  onSelect,
}: SharedProps) => {
  const { selectedFiles } = useSelectedFiles(projectId);

  const selectedFilesToDisplay = selectedFiles
    ?.filter((file) => file.type.includes(targetType))
    .filter((file) => !file.mimeType || mimeTypes?.includes(file.mimeType))
    .sort((fileA, fileB) => fileA.path.localeCompare(fileB.path));

  return selectedFilesToDisplay?.length ? (
    <ScrollList dense>
      {selectedFilesToDisplay.map(({ path: fullPath, type, mimeType }) => (
        <FileListItem
          checked={getChecked(value, fullPath)}
          folderIcon={<FolderSpecialRoundedIcon />}
          fullPath={fullPath}
          key={fullPath}
          mimeType={mimeType}
          projectId={projectId}
          title={fullPath}
          type={type}
          onSelect={(checked) => onSelect(getNewValue(fullPath, checked, multiple, value))}
        />
      ))}
    </ScrollList>
  ) : (
    <Typography align="center" variant="body2">
      You have no favourite files that are of the correct type
    </Typography>
  );
};
