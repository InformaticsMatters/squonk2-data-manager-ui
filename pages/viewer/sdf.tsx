import { withPageAuthRequired as withPageAuthRequiredCSR } from "@auth0/nextjs-auth0/client";
import { Container } from "@mui/material";
import Error from "next/error";
import Head from "next/head";
import { useRouter } from "next/router";

import { RoleRequired } from "../../components/auth/RoleRequired";
import { AS_ROLES, DM_ROLES } from "../../constants/auth";
import { SDFViewer } from "../../features/SDFViewer";
import { type SDFViewerDataProps } from "../../features/SDFViewer/SDFViewerData";
import Layout from "../../layouts/Layout";

const SDF = () => {
  const { query } = useRouter();

  const { project, path, file } = query;

  if (typeof project !== "string" || typeof path !== "string" || typeof file !== "string") {
    return <Error statusCode={404} title="File not found" />;
  }

  return (
    <>
      <Head>
        <title>Squonk | SDF Viewer </title>
      </Head>
      <RoleRequired roles={DM_ROLES}>
        <RoleRequired roles={AS_ROLES}>
          <Layout>
            <Container maxWidth="xl">
              <SDFView file={file} path={path} project={project} />
            </Container>
          </Layout>
        </RoleRequired>
      </RoleRequired>
    </>
  );
};

const SDFView = ({ project, path, file }: Omit<SDFViewerDataProps, "config">) => {
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

      <SDFViewer file={file} path={path} project={project} />
    </>
  );
};

export default withPageAuthRequiredCSR(SDF);
