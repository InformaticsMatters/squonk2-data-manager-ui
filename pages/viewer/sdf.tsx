import { withPageAuthRequired as withPageAuthRequiredCSR } from "@auth0/nextjs-auth0/client";
import { Container, Typography } from "@mui/material";
import Head from "next/head";
import { useRouter } from "next/router";

import { RoleRequired } from "../../components/auth/RoleRequired";
import { CenterLoader } from "../../components/CenterLoader";
import { AS_ROLES, DM_ROLES } from "../../constants/auth";
import type { SDFViewerProps } from "../../features/SDFViewer";
import { SDFViewer } from "../../features/SDFViewer";
import Layout from "../../layouts/Layout";

const SDF = () => {
  const { query } = useRouter();

  const { project, path, file } = query;

  return (
    <>
      <Head>
        <title>Squonk | SDF Viewer </title>
      </Head>
      <RoleRequired roles={DM_ROLES}>
        <RoleRequired roles={AS_ROLES}>
          <Layout>
            <Container maxWidth="xl">
              {typeof project !== "string" ||
              typeof path !== "string" ||
              typeof file !== "string" ? (
                <CenterLoader />
              ) : (
                <SDFView file={file} path={path} project={project} />
              )}
            </Container>
          </Layout>
        </RoleRequired>
      </RoleRequired>
    </>
  );
};

const SDFView = ({ project, path, file }: SDFViewerProps) => {
  // path and file to display
  const filePath = path === "" ? file : path + "/" + file;

  // normalise path for request
  if (!path.startsWith("/")) {
    path = "/" + path;
  }

  return (
    <>
      <Head>
        <title>Squonk | {filePath} </title>
      </Head>
      <Typography gutterBottom variant="h1">
        {filePath}
      </Typography>
      <SDFViewer file={file} path={path} project={project} />
    </>
  );
};

export default withPageAuthRequiredCSR(SDF);
