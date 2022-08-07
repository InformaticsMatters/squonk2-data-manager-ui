import { withPageAuthRequired } from "@auth0/nextjs-auth0/dist/frontend";
import { Container } from "@mui/material";
import type { GetServerSideProps } from "next";
import NextError from "next/error";
import { useRouter } from "next/router";

import { PlaintextViewer } from "../../../components/PlaintextViewer";
import { API_ROUTES } from "../../../constants/routes";
import { createErrorProps } from "../../../utils/api/serverSidePropsError";
import type { NotSuccessful, Successful } from "../../../utils/plaintextViewerSSR";
import { plaintextViewerSSR } from "../../../utils/plaintextViewerSSR";

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

/**
 * Displays plaintext viewer for a provided dataset version. The page is statically compiled, though
 * the content is populated in client. Firstly it parses information from provided `params`, then
 * fetches information about the dataset and finds the requested version. Finally it fetches a
 * limited amount of the version's content, which is then displayed. The helper functions (the ones
 * responsible for parsing `params` and selecting the version) are written in a declarative way.
 * While the whole functionality can be written imperatively using the `useEffect` hook, this should
 * allows us easier potential refactoring in the future.
 */
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
