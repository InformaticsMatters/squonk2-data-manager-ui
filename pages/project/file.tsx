import { withPageAuthRequired } from "@auth0/nextjs-auth0/dist/frontend";
import type { Theme } from "@mui/material";
import { Container, useMediaQuery } from "@mui/material";
import type { GetServerSideProps } from "next";
import NextError from "next/error";
import { useRouter } from "next/router";

import { PlaintextViewer } from "../../features/PlaintextViewer";
import type { NotSuccessful, Successful } from "../../utils/api/plaintextViewerSSR";
import { plaintextViewerSSR } from "../../utils/api/plaintextViewerSSR";
import { createErrorProps } from "../../utils/api/serverSidePropsError";
import { pathFromQuery } from "../../utils/app/paths";
import { API_ROUTES } from "../../utils/app/routes";

export type FileProps = Successful | NotSuccessful;

const isSuccessful = (props: FileProps): props is Successful =>
  typeof (props as Successful).content === "string";

export const getServerSideProps: GetServerSideProps<FileProps> = async ({ req, res, query }) => {
  let { path } = query;
  const { file, project } = query;

  if (typeof file !== "string" || typeof project !== "string") {
    return createErrorProps(res, 400, "File or project are not valid");
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

  const { file, project } = query;
  let { path = [] } = query;

  if (Array.isArray(path)) {
    path = path.join("/");
  }
  if (typeof file !== "string" || typeof project !== "string") {
    return <NextError statusCode={400} statusMessage="File or project are invalid" />;
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
