import type { FC } from 'react';
import React, { useState } from 'react';

import { css } from '@emotion/react';
import { Button, Collapse, Toolbar, Typography } from '@material-ui/core';

import type { ProjectId } from '../state/currentProjectHooks';
import { MiniFileList } from './MiniFileList';

export interface FileSelectorProps {
  type: 'directory' | 'dir' | 'file';
  multiple: boolean;
  projectId: NonNullable<ProjectId>;
  value?: string[] | string;
  onSelect: (selection: string[] | string | undefined) => void;
}

export const FileSelector: FC<FileSelectorProps> = ({ value, type, ...props }) => {
  const [expanded, setExpanded] = useState(false);
  const numberOfSelectedFiles = [value].flat().filter((f) => f !== undefined).length;

  return (
    <>
      <Collapse in={expanded}>
        <div>
          <MiniFileList {...props} type={type} value={value} />
        </div>
      </Collapse>
      <Toolbar disableGutters variant="dense">
        {!expanded ? (
          <>
            <Typography display="inline" variant="body2">
              Selected Files: {numberOfSelectedFiles > 0 ? <b>{numberOfSelectedFiles}</b> : 'None'}
            </Typography>
            <Button
              css={css`
                margin-left: auto;
              `}
              size="small"
              variant="outlined"
              onClick={() => setExpanded(true)}
            >
              Select {type}
            </Button>
          </>
        ) : (
          <Button
            css={css`
              margin-left: auto;
            `}
            size="small"
            variant="outlined"
            onClick={() => setExpanded(false)}
          >
            Close
          </Button>
        )}
      </Toolbar>
    </>
  );
};
