import { useState } from 'react';

import { Container, Link, Typography } from '@material-ui/core';

import { ModalWrapper } from '../../modals/ModalWrapper';
import type { TableFile } from './../types';
import { FileContents } from './FileContents';

export interface ProjectFileDetailsProps {
  file: TableFile;
}

export const ProjectFileDetails = ({ file }: ProjectFileDetailsProps) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Link component="button" variant="body1" onClick={() => setOpen(true)}>
        {file.fileName}
      </Link>
      <ModalWrapper
        DialogProps={{ fullScreen: true }}
        id={`${file.file_id || file.fileName}-details`}
        open={open}
        title={`File ${file.fileName}`}
        onClose={() => setOpen(false)}
      >
        <Container maxWidth="md">
          <Typography gutterBottom component="h3" variant="h2">
            Project File Actions
          </Typography>
          {file.file_id ? (
            <>
              <Typography gutterBottom component="h4" variant="h3">
                File Contents
              </Typography>
              <FileContents fileId={file.file_id} />
            </>
          ) : (
            <Typography variant="body2">There are no actions available for this file.</Typography>
          )}
        </Container>
      </ModalWrapper>
    </>
  );
};
