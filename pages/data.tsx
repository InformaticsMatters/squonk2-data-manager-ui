import React from 'react';

import { withPageAuthRequired } from '@auth0/nextjs-auth0';
import { css } from '@emotion/react';
import { Container, useTheme } from '@material-ui/core';

import { DataTableManager } from '../components/DataTable/TableManager';
import Layout from '../components/Layout';
import { RoleRequired } from '../utils/RoleRequired';

const Data = () => {
  const theme = useTheme();

  return (
    <RoleRequired roles={process.env.NEXT_PUBLIC_KEYCLOAK_USER_ROLE?.split(' ')}>
      <Layout>
        <Container
          css={css`
            margin-top: ${theme.spacing(4)}px;
          `}
        >
          <DataTableManager />
        </Container>
      </Layout>
    </RoleRequired>
  );
};

export default withPageAuthRequired(Data);
