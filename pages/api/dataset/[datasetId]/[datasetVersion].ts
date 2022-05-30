import { withApiAuthRequired } from "@auth0/nextjs-auth0";
import { withSentry } from "@sentry/nextjs";

import { handleApiError } from "../../../../utils/api/handleApiError";
import { restreamDownload } from "../../../../utils/api/restreamDownload";

export default withSentry(
  withApiAuthRequired(async (req, res) => {
    const { datasetId, datasetVersion } = req.query;

    try {
      await restreamDownload(`/dataset/${datasetId}/${datasetVersion}`, req, res);
    } catch (error) {
      handleApiError(res, error);
    }
  }),
);

export const config = {
  api: {
    externalResolver: true,
  },
};
