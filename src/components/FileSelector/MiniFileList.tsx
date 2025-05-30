import { useState } from "react";

import { Box, Checkbox, FormControlLabel } from "@mui/material";

import { useSelectedFiles } from "../../state/fileSelection";
import { AllFilesList } from "./AllFilesList";
import { FavouritesList } from "./FavouritesList";
import { type SharedProps } from "./types";

/**
 * List of files and directories, either from the list of favourites or project volume, with option
 * to select them.
 */
export const MiniFileList = (props: SharedProps) => {
  const { selectedFiles } = useSelectedFiles(props.projectId);
  const [showFavouritesList, setShowFavouritesList] = useState(
    !!selectedFiles?.filter((file) => file.type.includes(props.targetType)).length,
  );

  return (
    <Box sx={{ border: "2px dashed", borderColor: "grey.600", borderRadius: 8, px: 2, py: 1 }}>
      <FormControlLabel
        control={
          <Checkbox
            checked={showFavouritesList}
            onChange={(_event, checked) => setShowFavouritesList(checked)}
          />
        }
        label="Show favourite files"
      />

      {showFavouritesList ? <FavouritesList {...props} /> : <AllFilesList {...props} />}
    </Box>
  );
};
