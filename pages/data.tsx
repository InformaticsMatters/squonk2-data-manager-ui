import { useState } from 'react';

import { withPageAuthRequired } from '@auth0/nextjs-auth0';
import { css } from '@emotion/react';
import { Container, useTheme } from '@material-ui/core';
import { ProjectSummary } from '@squonk/data-manager-client';

import { DataTableManager } from '../components/DataTable/DataTableManager';
import { FileUpload } from '../components/FileUpload/FileUpload';
import Layout from '../components/Layout';
import ProjectManager from '../components/ProjectManager';

const Data = () => {
  const [currentProject, setCurrentProject] = useState<ProjectSummary | null>(null);

  const theme = useTheme();
  return (
    <Layout>
      <Container
        css={css`
          margin-top: ${theme.spacing(4)}px;
        `}
      >
        <ProjectManager setCurrentProject={setCurrentProject} currentProject={currentProject} />
        <FileUpload />
        <DataTableManager currentProject={currentProject} />
      </Container>
    </Layout>
  );
};

export default withPageAuthRequired(Data);
