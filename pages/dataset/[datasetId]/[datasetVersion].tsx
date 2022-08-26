import { withPageAuthRequired } from "@auth0/nextjs-auth0/dist/frontend";
import { Container } from "@mui/material";
import type { GetServerSideProps } from "next";
import NextError from "next/error";
import { useRouter } from "next/router";

import { API_ROUTES } from "../../../constants/routes";
import { PlaintextViewer } from "../../../features/PlaintextViewer";
import type { NotSuccessful, Successful } from "../../../utils/api/plaintextViewerSSR";
import { plaintextViewerSSR } from "../../../utils/api/plaintextViewerSSR";
import { createErrorProps } from "../../../utils/api/serverSidePropsError";

export type DatasetVersionProps = Successful | NotSuccessful;

const isSuccessful = (props: DatasetVersionProps): props is Successful =>
  typeof (props as Successful).content === "string";

export const getServerSideProps: GetServerSideProps<DatasetVersionProps> = async ({
  req,
  res,
  query,
}) => {
  const { datasetId } = query;
  const { datasetVersion } = query;

  if (typeof datasetId !== "string" || typeof datasetVersion !== "string") {
    return createErrorProps(res, 500, "File or path are not valid");
  }

  const version = Number(datasetVersion);
  if (isNaN(version)) {
    return createErrorProps(res, 400, "The dataset version must be a whole number");
  }

  const compressed = true;

  const url = process.env.DATA_MANAGER_API_SERVER + API_ROUTES.datasetVersion(datasetId, version);

  return await plaintextViewerSSR(req, res, { url, compressed });
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

export default withPageAuthRequired(DatasetVersion);
