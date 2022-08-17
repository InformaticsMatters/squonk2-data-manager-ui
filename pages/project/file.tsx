import { withPageAuthRequired } from "@auth0/nextjs-auth0/dist/frontend";
import type { Theme } from "@mui/material";
import { Container, useMediaQuery } from "@mui/material";
import type { GetServerSideProps } from "next";
import NextError from "next/error";
import { useRouter } from "next/router";

import { PlaintextViewer } from "../../components/PlaintextViewer";
import { API_ROUTES } from "../../constants/routes";
import { createErrorProps } from "../../utils/api/serverSidePropsError";
import { pathFromQuery } from "../../utils/paths";
import type { NotSuccessful, Successful } from "../../utils/plaintextViewerSSR";
import { plaintextViewerSSR } from "../../utils/plaintextViewerSSR";

export type FileProps = Successful | NotSuccessful;

const isSuccessful = (props: FileProps): props is Successful =>
  typeof (props as Successful).content === "string";

export const getServerSideProps: GetServerSideProps<FileProps> = async ({ req, res, query }) => {
  let { path } = query;
  const { file, project } = query;

  if (path === undefined || typeof file !== "string" || typeof project !== "string") {
    return createErrorProps(res, 500, "File, path or project are not valid");
  }

  path = pathFromQuery(path);

  let compressed = false;
  if (file.endsWith(".gz") || file.endsWith(".gzip")) {
    compressed = true;
  }

  const url = process.env.DATA_MANAGER_API_SERVER + API_ROUTES.projectFile(project, path, file);

  return await plaintextViewerSSR(req, res, { url, compressed });
};

export const File = (props: FileProps) => {
  const biggerThanSm = useMediaQuery<Theme>((theme) => theme.breakpoints.up("sm"));

  const { query } = useRouter();

  const { file, project, path } = query;

  if (typeof path !== "string" || typeof file !== "string" || typeof project !== "string") {
    return <NextError statusCode={400} />;
  }

  const title = (path.endsWith("/") ? path : path + "/") + file;
  const compressed = title.endsWith(".gz") || title.endsWith(".gzip");

  if (isSuccessful(props)) {
    return (
      <Container disableGutters={!biggerThanSm} maxWidth="xl">
        <PlaintextViewer {...props} compressed={compressed} title={title} />
      </Container>
    );
  }

  const { statusCode, statusMessage } = props;
  return <NextError statusCode={statusCode} statusMessage={statusMessage} />;
};

export default withPageAuthRequired(File);
