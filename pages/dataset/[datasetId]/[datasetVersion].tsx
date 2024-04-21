import { withPageAuthRequired as withPageAuthRequiredSSR } from "@auth0/nextjs-auth0";
import { withPageAuthRequired as withPageAuthRequiredCSR } from "@auth0/nextjs-auth0/client";
import { Container } from "@mui/material";
import NextError from "next/error";
import { useRouter } from "next/router";
import { type GetServerSideProps } from "nextjs-routes";

import { PlaintextViewer } from "../../../features/PlaintextViewer";
import {
  type NotSuccessful,
  plaintextViewerSSR,
  type Successful,
} from "../../../utils/api/plaintextViewerSSR";
import { createErrorProps } from "../../../utils/api/serverSidePropsError";
import { API_ROUTES } from "../../../utils/app/routes";
import { getFullReturnTo } from "../../../utils/next/ssr";

export type DatasetVersionProps = NotSuccessful | Successful;

const isSuccessful = (props: DatasetVersionProps): props is Successful =>
  typeof (props as Successful).content === "string";

export const getServerSideProps: GetServerSideProps<DatasetVersionProps> = async (ctx) => {
  const returnTo = getFullReturnTo(ctx);
  return withPageAuthRequiredSSR<DatasetVersionProps>({
    returnTo,
    getServerSideProps: async ({ req, res, query }) => {
      const { datasetId } = query;
      const { datasetVersion } = query;

      if (typeof datasetId !== "string" || typeof datasetVersion !== "string") {
        return createErrorProps(res, 500, "File or path are not valid");
      }

      const version = Number(datasetVersion);
      if (Number.isNaN(version)) {
        return createErrorProps(res, 400, "The dataset version must be a whole number");
      }

      const compressed = true;

      const url =
        process.env.DATA_MANAGER_API_SERVER + API_ROUTES.datasetVersion(datasetId, version);

      return plaintextViewerSSR(req, res, { url, compressed });
    },
  })(ctx);
};

const DatasetVersion = (props: DatasetVersionProps) => {
  const { query } = useRouter();

  const { datasetId, datasetVersion } = query;

  if (typeof datasetId !== "string" || typeof datasetVersion !== "string") {
    return <NextError statusCode={400} />;
  }

  const compressed = true;
  const title = "";

  if (isSuccessful(props)) {
    return (
      <Container maxWidth="xl">
        <PlaintextViewer {...props} compressed={compressed} title={title} />
      </Container>
    );
  }

  const { statusCode, statusMessage } = props;
  return <NextError statusCode={statusCode} statusMessage={statusMessage} />;
};

export default withPageAuthRequiredCSR(DatasetVersion);
