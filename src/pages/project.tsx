import { withPageAuthRequired as withPageAuthRequiredCSR } from "@auth0/nextjs-auth0/client";
import { Box, Container, Grid2 as Grid, Typography } from "@mui/material";
import Head from "next/head";
import Image from "next/image";

import { RoleRequired } from "../components/auth/RoleRequired";
import { ProjectSelection } from "../components/projects/ProjectSelection";
import { SelectProject } from "../components/userContext/SelectProject";
import { AS_ROLES, DM_ROLES } from "../constants/auth";
import { ProjectTable } from "../features/ProjectTable";
import { ProjectFileUpload } from "../features/ProjectTable/ProjectFileUpload";
import { UserBootstrapper } from "../features/UserBootstrapper";
import { useCurrentProject } from "../hooks/projectHooks";
import Layout from "../layouts/Layout";
import { type NotSuccessful, type ReactQueryPageProps } from "../utils/next/ssr";

export type ProjectProps = NotSuccessful | ReactQueryPageProps | Record<string, never>;

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
                    <Grid size={{ md: 6, xs: 12 }}>
                      <Typography
                        gutterBottom
                        component="h1"
                        sx={{ wordBreak: "break-all" }}
                        variant={currentProject.name.length > 16 ? "h2" : "h1"}
                      >
                        Project: {currentProject.name}
                      </Typography>
                    </Grid>
                    <Grid size={{ md: 6, xs: 12 }}>
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
                  <Box sx={{ marginY: 1 }}>
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
