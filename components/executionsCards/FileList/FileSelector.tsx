import type { FC } from 'react';
import React, { useState } from 'react';

import { css } from '@emotion/react';
import { Button, Collapse, Toolbar, Tooltip, Typography } from '@material-ui/core';

import { MiniFileList } from './MiniFileList';
import type { SharedProps } from './types';

export const FileSelector: FC<SharedProps> = ({ value, targetType, ...props }) => {
  const [expanded, setExpanded] = useState(false);

  const files = [value].flat().filter((f) => f !== undefined);

  return (
    <>
      <Collapse in={expanded}>
        <div>
          <MiniFileList {...props} targetType={targetType} value={value} />
        </div>
      </Collapse>
      <Toolbar disableGutters variant="dense">
        {!expanded ? (
          <>
            <Typography
              noWrap
              css={css`
                white-space: break-spaces;
              `}
              display="inline"
              variant="body2"
            >
              Selected Files:{' '}
              {files.length === 1 ? (
                files[0]
              ) : files.length > 1 ? (
                <Tooltip title={files.slice(1).join(', ')}>
                  <span>
                    {files[0]} and <b>{files.length - 1} more</b>
                  </span>
                </Tooltip>
              ) : (
                'None'
              )}
            </Typography>
            <Button
              css={css`
                margin-left: auto;
              `}
              size="small"
              variant="outlined"
              onClick={() => setExpanded(true)}
            >
              Select {targetType}
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
