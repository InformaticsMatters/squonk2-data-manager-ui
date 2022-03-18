import { QueryClient } from 'react-query';
import { dehydrate } from 'react-query/hydration';

import { getFiles, getGetFilesQueryKey } from '@squonk/data-manager-client/file';
import { getGetProjectsQueryKey, getProjects } from '@squonk/data-manager-client/project';

import { getAccessToken, withPageAuthRequired } from '@auth0/nextjs-auth0';
import { css } from '@emotion/react';
import { Box, Container, Grid, Typography } from '@material-ui/core';
import type { GetServerSideProps } from 'next';
import Head from 'next/head';
import Image from 'next/image';

import Layout from '../components/Layout';
import { ProjectSelection } from '../components/ProjectSelection';
import { ProjectTable } from '../components/ProjectTable';
import { ProjectFileUpload } from '../components/ProjectTable/ProjectFileUpload';
import { ProjectAutocomplete } from '../components/userContext/ProjectAutocomplete';
import { useCurrentProject } from '../hooks/projectHooks';
import { RoleRequired } from '../utils/RoleRequired';
import { options } from '../utils/ssrQueryOptions';

export const getServerSideProps: GetServerSideProps = async ({ req, res, query }) => {
  const queryClient = new QueryClient();

  try {
    const { accessToken } = await getAccessToken(req, res);

    const projectId = query.project as string | undefined;
    const path = query.path as string[] | undefined;

    if (projectId && accessToken) {
      const filesParam = { project_id: projectId, path: '/' + (path?.join('/') ?? '') };

      // Prefetch some data
      const queries = [
        queryClient.prefetchQuery(getGetProjectsQueryKey(), () =>
          getProjects(options(accessToken)),
        ),
        queryClient.prefetchQuery(getGetFilesQueryKey(filesParam), () =>
          getFiles(filesParam, options(accessToken)),
        ),
      ];

      // Make the queries in parallel
      await Promise.allSettled(queries);
    }
  } catch (error) {
    // TODO: smarter handling
    console.error(error);
  }

  return {
    props: {
      dehydratedState: dehydrate(queryClient),
    },
  };
};

/**
 * The project page display and allows the user to manage files inside a project.
 */
const Project = () => {
  const currentProject = useCurrentProject();

  return (
    <>
      <Head>
        <title>Squonk | Project</title>
      </Head>
      <RoleRequired roles={process.env.NEXT_PUBLIC_KEYCLOAK_DM_USER_ROLE?.split(' ')}>
        <Layout>
          <Container>
            {currentProject ? (
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
                  <ProjectSelection />
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
