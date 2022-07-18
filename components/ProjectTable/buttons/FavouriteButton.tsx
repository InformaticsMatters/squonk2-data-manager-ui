import StarBorderRoundedIcon from "@mui/icons-material/StarBorderRounded";
import StarRoundedIcon from "@mui/icons-material/StarRounded";
import { IconButton, Tooltip } from "@mui/material";

import type { ProjectId } from "../../../hooks/projectHooks";
import type { SavedFile } from "../../../state/fileSelection";
import { useSelectedFiles } from "../../../state/fileSelection";

export interface FavouriteButtonProps {
  /**
   * ID of the project under which the favourite file or directory is scoped
   */
  projectId: ProjectId;
  /**
   * The path of the file. This is used to identify a file in the favourite files/directories list.
   */
  fullPath: string;
  /**
   * Whether the item is a file or a directory.
   */
  type: SavedFile["type"];
  /**
   * Mime-type of the file. Undefined if fullPath corresponds to a directory.
   */
  mimeType: string | undefined;
}

/**
 * Button that controls a file's favourite state in the selected files context.
 */
export const FavouriteButton = ({ projectId, fullPath, type, mimeType }: FavouriteButtonProps) => {
  const { selectedFiles, addFile, removeFile } = useSelectedFiles(projectId);

  const file = selectedFiles?.find((file) => file.path === fullPath);

  const handleFavouriteChange = () => {
    !file
      ? addFile && addFile({ path: fullPath, type, mimeType })
      : removeFile && removeFile({ path: fullPath, type, mimeType });
  };

  return (
    <Tooltip title="Favourite this file">
      <IconButton size="small" onClick={handleFavouriteChange}>
        {file ? <StarRoundedIcon /> : <StarBorderRoundedIcon />}
      </IconButton>
    </Tooltip>
  );
};
