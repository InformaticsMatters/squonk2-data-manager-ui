import { withPageAuthRequired } from '@auth0/nextjs-auth0';
import { css } from '@emotion/react';
import { Container, Typography } from '@material-ui/core';
import Head from 'next/head';
import Image from 'next/image';

import Layout from '../components/Layout';
import { ProjectTable } from '../components/ProjectTable';
import { useCurrentProject } from '../hooks/currentProjectHooks';
import { RoleRequired } from '../utils/RoleRequired';

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
      <RoleRequired roles={process.env.NEXT_PUBLIC_KEYCLOAK_USER_ROLE?.split(' ')}>
        <Layout>
          <Container>
            {currentProject ? (
              <>
                <Typography gutterBottom variant="h1">
                  Project: {currentProject.name}
                </Typography>
                <ProjectTable currentProject={currentProject} />
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
              </div>
            )}
          </Container>
        </Layout>
      </RoleRequired>
    </>
  );
};

export default withPageAuthRequired(Project);
