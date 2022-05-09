import { useState } from 'react';

import { Box, Button, Collapse } from '@mui/material';

import { MiniFileList } from './MiniFileList';
import { SelectedFilesLabel } from './SelectedFilesLabel';
import type { SharedProps } from './types';

/**
 * General component for selecting files from a project volume or favourite files from that project.
 */
export const FileSelector = ({ value, targetType, ...props }: SharedProps) => {
  const [expanded, setExpanded] = useState(false);

  // Convert the value so a consistent string array format
  const files = [value].flat().filter((f): f is string => f !== undefined);

  const openControls = (
    <>
      <SelectedFilesLabel files={files} />

      <Button size="small" sx={{ ml: 'auto' }} variant="outlined" onClick={() => setExpanded(true)}>
        Select {targetType}
      </Button>
    </>
  );

  const closeControls = (
    <Button size="small" sx={{ ml: 'auto' }} variant="outlined" onClick={() => setExpanded(false)}>
      Close
    </Button>
  );

  return (
    <>
      <Collapse in={expanded}>
        <MiniFileList {...props} targetType={targetType} value={value} />
      </Collapse>
      <Box display="flex" paddingY={1}>
        {expanded ? closeControls : openControls}
      </Box>
    </>
  );
};
