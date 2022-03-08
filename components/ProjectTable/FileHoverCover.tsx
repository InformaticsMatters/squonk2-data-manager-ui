import { css } from '@emotion/react';
import { Typography, useTheme } from '@material-ui/core';
import { Alert, AlertTitle } from '@material-ui/lab';

export interface FileHoverCoverProps {
  active: boolean;
}

export const FileHoverCover = ({ active }: FileHoverCoverProps) => {
  const theme = useTheme();

  return (
    <>
      <div
        css={css`
          position: absolute;
          left: 0;
          right: 0;
          top: 0;
          bottom: 0;
          background-color: ${theme.palette.grey[600]};
          opacity: ${active ? '40%' : '0%'};
          transition: ${theme.transitions.easing.easeIn} opacity
            ${theme.transitions.duration.shortest}ms;
        `}
      />

      <div
        css={css`
          position: absolute;
          left: 0;
          right: 0;
          top: 50px;
          display: flex;
          justify-content: center;
          align-items: center;
          opacity: ${active ? '100%' : '0%'};
          transition: ${theme.transitions.easing.easeIn} opacity
            ${theme.transitions.duration.shortest}ms;
        `}
      >
        <Alert severity="info">
          <AlertTitle>
            <Typography component="h2" variant="h3">
              Upload File to Current Project
            </Typography>
          </AlertTitle>
          <Typography component="p" variant="h4">
            Drag and drop files here
          </Typography>
        </Alert>
      </div>
    </>
  );
};
