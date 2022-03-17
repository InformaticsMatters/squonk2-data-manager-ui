import { useGetProjects } from '@squonk/data-manager-client/project';

import { withPageAuthRequired } from '@auth0/nextjs-auth0';
import { css } from '@emotion/react';
import { Box, Container, Grid, Typography } from '@material-ui/core';
import Head from 'next/head';
import Image from 'next/image';

import { CenterLoader } from '../components/CenterLoader';
import Layout from '../components/Layout';
import { ProjectTable } from '../components/ProjectTable';
import { ProjectFileUpload } from '../components/ProjectTable/ProjectFileUpload';
import { OrganisationAutocomplete } from '../components/userContext/OrganisationAutocomplete';
import { ProjectAutocomplete } from '../components/userContext/ProjectAutocomplete';
import { UnitAutocomplete } from '../components/userContext/UnitAutocomplete';
import { useCurrentProject } from '../hooks/projectHooks';
import { RoleRequired } from '../utils/RoleRequired';

/**
 * The project page display and allows the user to manage files inside a project.
 */
const Project = () => {
  const currentProject = useCurrentProject();
  const { isLoading } = useGetProjects();

  return (
    <>
      <Head>
        <title>Squonk | Project</title>
      </Head>
      <RoleRequired roles={process.env.NEXT_PUBLIC_KEYCLOAK_DM_USER_ROLE?.split(' ')}>
        <Layout>
          <Container>
            {isLoading ? (
              <CenterLoader />
            ) : currentProject ? (
              <>
                <Grid
                  container
                  css={css`
                    display: flex;
                    align-items: center;
                  `}
                >
                  <Grid item md={6} xs={12}>
                    <Typography
                      gutterBottom
                      component="h1"
                      css={css`
                        word-break: break-all;
                      `}
                      variant={currentProject.name.length > 16 ? 'h2' : 'h1'}
                    >
                      Project: {currentProject.name}
                    </Typography>
                  </Grid>
                  <Grid item md={6} xs={12}>
                    <ProjectAutocomplete size="medium" />
                  </Grid>
                </Grid>
                <ProjectFileUpload>
                  {(open) => (
                    <ProjectTable currentProject={currentProject} openUploadDialog={open} />
                  )}
                </ProjectFileUpload>
              </>
            ) : (
              <div
                css={css`
                  text-align: center;
                `}
              >
                <Typography gutterBottom color="textSecondary" variant="h3">
                  Select a project to view
                </Typography>
                <Image
                  height={150}
                  src="https://squonk.informaticsmatters.org/assets/sadderSquonk.svg"
                  width={150}
                />
                <Box marginY={1}>
                  <Grid container spacing={1}>
                    <Grid container item alignItems="center" sm={6}>
                      <OrganisationAutocomplete />
                    </Grid>
                    <Grid container item alignItems="center" sm={6}>
                      <UnitAutocomplete />
                    </Grid>
                    <Grid container item alignItems="center" sm={12}>
                      <ProjectAutocomplete size="medium" />
                    </Grid>
                  </Grid>
                </Box>
              </div>
            )}
          </Container>
        </Layout>
      </RoleRequired>
    </>
  );
};

export default withPageAuthRequired(Project);
