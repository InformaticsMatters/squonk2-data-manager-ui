import { useState } from 'react';

import { Container, Link, Typography } from '@material-ui/core';

import { ModalWrapper } from '../../modals/ModalWrapper';
import { PageSection } from './../../PageSection';
import type { TableFile } from './../types';
import { ProjectViewSection } from './ProjectViewSection';

export interface ProjectFileDetailsProps {
  /**
   * Selected file.
   */
  file: TableFile;
}

/**
 * Displays details and actions about the selected file.
 */
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
          <PageSection level={3} title="Project File Actions">
            {file.file_id ? (
              <PageSection title="View File">
                <ProjectViewSection fileId={file.file_id} />
              </PageSection>
            ) : (
              <Typography variant="body2">There are no actions available for this file.</Typography>
            )}
          </PageSection>
        </Container>
      </ModalWrapper>
    </>
  );
};
