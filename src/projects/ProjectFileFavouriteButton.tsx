import { IconButton, Tooltip } from "@mui/material";

import { FavouriteIcon } from "../components/icons";
import { type FavouriteFile, useProjectFileFavourites } from "./fileFavourites";

/**
 * Marks one file or directory as a favourite of the project it belongs to. The project is always
 * named by the caller, so a favourite is recorded against the project whose file it is and never
 * against whichever project a selection last remembered. Favouriting changes nothing in the Data
 * Manager, so it stays available to a caller who may not change the project's files.
 */
export const ProjectFileFavouriteButton = ({
  file,
  projectId,
}: {
  file: FavouriteFile;
  projectId: string;
}) => {
  const { isFavourite, toggleFavourite } = useProjectFileFavourites(projectId);
  const favourited = isFavourite(file.path);

  return (
    <Tooltip title={favourited ? "Remove from favourites" : "Add to favourites"}>
      <IconButton
        aria-label={favourited ? `Unfavourite ${file.path}` : `Favourite ${file.path}`}
        size="small"
        onClick={(event) => {
          event.stopPropagation();
          toggleFavourite(file);
        }}
      >
        <FavouriteIcon sx={{ fill: favourited ? "currentColor" : "none" }} />
      </IconButton>
    </Tooltip>
  );
};
