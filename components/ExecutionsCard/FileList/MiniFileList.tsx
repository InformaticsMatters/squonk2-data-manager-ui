import React, { useState } from 'react';

import { Box, Checkbox, FormControlLabel } from '@material-ui/core';

import { useSelectedFiles } from '../../state/FileSelectionContext';
import { AllFilesList } from './AllFilesList';
import { FavouritesList } from './FavouritesList';
import type { SharedProps } from './types';

export const MiniFileList = (props: SharedProps) => {
  const { selectedFiles } = useSelectedFiles(props.projectId);
  const [showFavouritesList, setShowFavouritesList] = useState(
    !!selectedFiles?.filter((file) => file.type.includes(props.targetType))?.length,
  );

  return (
    <Box border="2px dashed" borderColor="grey.600" borderRadius={8} px={2} py={1}>
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
