import { withApiAuthRequired } from '@auth0/nextjs-auth0';

import { handleApiError } from '../../../../apiUtils/handleApiError';
import { restreamDownload } from '../../../../apiUtils/restreamDownload';

export default withApiAuthRequired(async (req, res) => {
  const { datasetId, datasetVersion } = req.query;

  try {
    await restreamDownload(`/dataset/${datasetId}/${datasetVersion}`, req, res);
  } catch (error) {
    handleApiError(res, error);
  }
});
