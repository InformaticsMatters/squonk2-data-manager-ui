import { withPageAuthRequired } from '@auth0/nextjs-auth0';
import { Container, Typography } from '@material-ui/core';
import Head from 'next/head';

import { DatasetsTable } from '../components/DatasetsTable';
import Layout from '../components/Layout';
import { RoleRequired } from '../utils/RoleRequired';

/**
 * The datasets page displays datasets the user is able to see and allows the user to manage these.
 */
const Datasets = () => {
  return (
    <>
      <Head>
        <title>Squonk | Datasets</title>
      </Head>
      <RoleRequired roles={process.env.NEXT_PUBLIC_KEYCLOAK_USER_ROLE?.split(' ')}>
        <Layout>
          <Container>
            <Typography gutterBottom variant="h1">
              Datasets
            </Typography>
            <DatasetsTable />
          </Container>
        </Layout>
      </RoleRequired>
    </>
  );
};

export default withPageAuthRequired(Datasets);
