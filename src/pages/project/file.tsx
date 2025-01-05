import { withPageAuthRequired as withPageAuthRequiredSSR } from "@auth0/nextjs-auth0";
import { withPageAuthRequired as withPageAuthRequiredCSR } from "@auth0/nextjs-auth0/client";
import { Container, type Theme, useMediaQuery } from "@mui/material";
import NextError from "next/error";
import { useRouter } from "next/router";
import { type GetServerSideProps } from "nextjs-routes";

import { PlaintextViewer } from "../../features/PlaintextViewer";
import {
  type NotSuccessful,
  plaintextViewerSSR,
  type Successful,
} from "../../utils/api/plaintextViewerSSR";
import { createErrorProps } from "../../utils/api/serverSidePropsError";
import { pathFromQuery } from "../../utils/app/paths";
import { projectFileURL } from "../../utils/app/routes";
import { getFullReturnTo } from "../../utils/next/ssr";

export type FileProps = NotSuccessful | Successful;

const isSuccessful = (props: FileProps): props is Successful =>
  typeof (props as Successful).content === "string";

export const getServerSideProps: GetServerSideProps<FileProps> = async (ctx) => {
  const returnTo = getFullReturnTo(ctx);
  return withPageAuthRequiredSSR<FileProps>({
    returnTo,
    getServerSideProps: async ({ req, res, query }) => {
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

      const url = projectFileURL(project, path, file);

      return plaintextViewerSSR(req, res, { url, compressed });
    },
  })(ctx);
};

export const File = (props: FileProps) => {
  const biggerThanSm = useMediaQuery((theme: Theme) => theme.breakpoints.up("sm"));

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

export default withPageAuthRequiredCSR(File);
