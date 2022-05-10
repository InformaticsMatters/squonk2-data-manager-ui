import { Alert, AlertTitle, styled, Typography } from '@mui/material';

export interface FileHoverCoverProps {
  active: boolean;
}

const HoverBox = styled('div')(({ theme }) => ({
  position: 'absolute',
  left: 0,
  right: 0,
  transition: `${theme.transitions.easing.easeIn} opacity ${theme.transitions.duration.shortest}ms`,
}));

export const FileHoverCover = ({ active }: FileHoverCoverProps) => {
  return (
    <>
      <HoverBox
        sx={{
          top: 0,
          bottom: 0,
          backgroundColor: 'grey.600',
          opacity: active ? '40%' : '0%',
        }}
      />

      <HoverBox
        sx={{
          top: '50px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          opacity: active ? '100%' : '0%',
        }}
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
      </HoverBox>
    </>
  );
};
