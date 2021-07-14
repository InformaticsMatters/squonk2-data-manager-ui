import { withPageAuthRequired } from '@auth0/nextjs-auth0';
import { css } from '@emotion/react';
import { Container, useTheme } from '@material-ui/core';

import { DataTableManager } from '../components/DataTable/TableManager';
import Layout from '../components/Layout';

const Data = () => {
  const theme = useTheme();
  return (
    <Layout>
      <Container
        css={css`
          margin-top: ${theme.spacing(4)}px;
        `}
      >
        <DataTableManager />
      </Container>
    </Layout>
  );
};

export default withPageAuthRequired(Data);
