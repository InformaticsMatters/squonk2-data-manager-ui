import { withPageAuthRequired } from '@auth0/nextjs-auth0';
import { Container } from '@material-ui/core';
import Head from 'next/head';

import { DataTableManager } from '../components/Data/TableManager';
import Layout from '../components/Layout';
import { RoleRequired } from '../utils/RoleRequired';

/**
 * The main data page. This page displays project data and datasets
 */
const Data = () => {
  return (
    <>
      <Head>
        <title>Squonk | Data</title>
      </Head>
      <RoleRequired roles={process.env.NEXT_PUBLIC_KEYCLOAK_USER_ROLE?.split(' ')}>
        <Layout>
          <Container>
            <DataTableManager />
          </Container>
        </Layout>
      </RoleRequired>
    </>
  );
};

export default withPageAuthRequired(Data);
