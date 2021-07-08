import { withPageAuthRequired } from '@auth0/nextjs-auth0';
import { css } from '@emotion/react';
import { Container, Grid, useTheme } from '@material-ui/core';

import { useCurrentProject } from '../components/currentProjectHooks';
import { DataTableManager } from '../components/DataTable/DataTableManager';
import { FileUpload } from '../components/FileUpload/FileUpload';
import Layout from '../components/Layout';

const Data = () => {
  const currentProject = useCurrentProject();

  const theme = useTheme();
  return (
    <Layout>
      <Container
        css={css`
          margin-top: ${theme.spacing(4)}px;
        `}
      >
        <Grid container alignItems="center" spacing={1}>
          <Grid item>
            <FileUpload />
          </Grid>
        </Grid>
        <DataTableManager currentProject={currentProject} />
      </Container>
    </Layout>
  );
};

export default withPageAuthRequired(Data);
