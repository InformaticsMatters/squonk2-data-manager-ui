import { getFiles, getGetFilesQueryKey } from "@squonk/data-manager-client/file-and-path";
import { getGetProjectsQueryKey, getProjects } from "@squonk/data-manager-client/project";

import {
  getAccessToken,
  withPageAuthRequired as withPageAuthRequiredSSR,
} from "@auth0/nextjs-auth0";
import { withPageAuthRequired as withPageAuthRequiredCSR } from "@auth0/nextjs-auth0/client";
import { Box, Container, Grid, Typography } from "@mui/material";
import { captureException } from "@sentry/nextjs";
import { dehydrate, QueryClient } from "@tanstack/react-query";
import Head from "next/head";
import Image from "next/image";
import type { GetServerSideProps } from "nextjs-routes";

import { RoleRequired } from "../components/auth/RoleRequired";
import { ProjectSelection } from "../components/projects/ProjectSelection";
import { SelectProject } from "../components/userContext/SelectProject";
import { AS_ROLES, DM_ROLES } from "../constants/auth";
import { ProjectTable } from "../features/ProjectTable";
import { ProjectFileUpload } from "../features/ProjectTable/ProjectFileUpload";
import { UserBootstrapper } from "../features/UserBootstrapper";
import { useCurrentProject } from "../hooks/projectHooks";
import Layout from "../layouts/Layout";
import { createErrorProps } from "../utils/api/serverSidePropsError";
import { dmOptions } from "../utils/api/ssrQueryOptions";
import { pathFromQuery } from "../utils/app/paths";
import type { NotSuccessful, ReactQueryPageProps } from "../utils/next/ssr";
import { getFullReturnTo } from "../utils/next/ssr";

export type ProjectProps = Record<string, never> | NotSuccessful | ReactQueryPageProps;

export const getServerSideProps: GetServerSideProps<ProjectProps> = async (ctx) => {
  const returnTo = getFullReturnTo(ctx);
  return withPageAuthRequiredSSR<ProjectProps>({
    returnTo,
    getServerSideProps: async ({ req, res, query }) => {
      const queryClient = new QueryClient();

      // When project isn't specified no requests can be made
      if (typeof query.project !== "string") {
        return { props: {} as Record<string, never> };
      }

      const projectId = query.project;

      try {
        const { accessToken } = await getAccessToken(req, res);

        const path = pathFromQuery(query.path);

        if (projectId && accessToken) {
          const filesParam = { project_id: projectId, path };

          // Prefetch some data
          const queries = [
            queryClient.prefetchQuery(getGetProjectsQueryKey(), () =>
              getProjects(undefined, dmOptions(accessToken)),
            ),
            queryClient.prefetchQuery(getGetFilesQueryKey(filesParam), () =>
              getFiles(filesParam, dmOptions(accessToken)),
            ),
          ];

          // Make the queries in parallel
          await Promise.allSettled(queries);
        }
      } catch (error) {
        captureException(error);
        return createErrorProps(res, 500, "Unknown error on the server");
      }

      return {
        props: {
          dehydratedState: dehydrate(queryClient),
        },
      };
    },
  })(ctx);
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
      <RoleRequired roles={DM_ROLES}>
        <RoleRequired roles={AS_ROLES}>
          <Layout>
            <Container maxWidth="xl">
              <UserBootstrapper />
              {currentProject ? (
                <>
                  <Grid
                    container
                    sx={{
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    <Grid item md={6} xs={12}>
                      <Typography
                        gutterBottom
                        component="h1"
                        sx={{ wordBreak: "break-all" }}
                        variant={currentProject.name.length > 16 ? "h2" : "h1"}
                      >
                        Project: {currentProject.name}
                      </Typography>
                    </Grid>
                    <Grid item md={6} xs={12}>
                      <SelectProject size="medium" />
                    </Grid>
                  </Grid>
                  <ProjectFileUpload>
                    {(open) => (
                      <ProjectTable currentProject={currentProject} openUploadDialog={open} />
                    )}
                  </ProjectFileUpload>
                </>
              ) : (
                <Box sx={{ textAlign: "center" }}>
                  <Typography gutterBottom color="textSecondary" variant="h3">
                    Select a project to view
                  </Typography>
                  <Image
                    alt="Squonk in tears that you haven't selected a project"
                    height={150}
                    src="https://squonk.informaticsmatters.org/assets/sadderSquonk.svg"
                    width={150}
                  />
                  <Box marginY={1}>
                    <ProjectSelection />
                  </Box>
                </Box>
              )}
            </Container>
          </Layout>
        </RoleRequired>
      </RoleRequired>
    </>
  );
};

export default withPageAuthRequiredCSR(Project);
