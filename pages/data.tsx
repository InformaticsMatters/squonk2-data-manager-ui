import { useState } from 'react';

import { withPageAuthRequired } from '@auth0/nextjs-auth0';
import { css } from '@emotion/react';
import { Container, useTheme } from '@material-ui/core';

import Layout from '../components/Layout';
import ProjectManager from '../components/ProjectManager';

const Data = () => {
  const [currentProject, setCurrentProject] = useState(null);

  const theme = useTheme();
  return (
    <Layout>
      <Container
        css={css`
          margin-top: ${theme.spacing(4)}px;
        `}
      >
        <ProjectManager currentProject={currentProject} />
      </Container>
    </Layout>
  );
};

export default withPageAuthRequired(Data);
