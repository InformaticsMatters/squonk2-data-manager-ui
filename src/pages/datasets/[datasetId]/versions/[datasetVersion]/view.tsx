import { type GetServerSideProps } from "nextjs-routes";

import { pagePolicies, withPagePolicy } from "../../../../../application/pagePolicy";
import { DatasetViewer, type DatasetViewerProps } from "../../../../../datasets/DatasetViewer";
import { isDatasetId, isDatasetVersion } from "../../../../../routing/identifiers";
import { plaintextViewerSSR } from "../../../../../utils/api/plaintextViewerSSR";
import { createErrorProps } from "../../../../../utils/api/serverSidePropsError";
import { API_ROUTES } from "../../../../../utils/app/routes";
import { getFullReturnTo } from "../../../../../utils/next/ssr";
import { withPageAuthRequiredSSR } from "../../../../../utils/next/withPageAuthRequiredSSR";

export const getServerSideProps: GetServerSideProps<DatasetViewerProps> = async (ctx) => {
  const returnTo = getFullReturnTo(ctx);
  return withPageAuthRequiredSSR<DatasetViewerProps>({
    returnTo,
    getServerSideProps: async ({ req, res, query }) => {
      const { datasetId, datasetVersion } = query;
      if (
        typeof datasetId !== "string" ||
        typeof datasetVersion !== "string" ||
        !isDatasetId(datasetId) ||
        !isDatasetVersion(datasetVersion)
      ) {
        return createErrorProps(res, 404, "Dataset version not found");
      }
      const version = Number(datasetVersion);
      const url =
        process.env.DATA_MANAGER_API_SERVER + API_ROUTES.datasetVersion(datasetId, version);
      return plaintextViewerSSR(req, res, { url, compressed: true });
    },
  })(ctx);
};

export default withPagePolicy(pagePolicies.datasets("viewer"), DatasetViewer);
