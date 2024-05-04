import { withPageAuthRequired } from "@auth0/nextjs-auth0/client";
import { Container, Typography } from "@mui/material";
import Head from "next/head";

import { RoleRequired } from "../components/auth/RoleRequired";
import { AS_ROLES, DM_ROLES } from "../constants/auth";
import { DatasetsTable } from "../features/DatasetsTable";
import Layout from "../layouts/Layout";

/**
 * The datasets page displays datasets the user is able to see and allows the user to manage these.
 */
const Datasets = () => {
  return (
    <>
      <Head>
        <title>Squonk | Datasets</title>
      </Head>
      <RoleRequired roles={DM_ROLES}>
        <RoleRequired roles={AS_ROLES}>
          <Layout>
            <Container maxWidth="xl">
              <Typography gutterBottom variant="h1">
                Datasets
              </Typography>
              <DatasetsTable />
            </Container>
          </Layout>
        </RoleRequired>
      </RoleRequired>
    </>
  );
};

export default withPageAuthRequired(Datasets);
