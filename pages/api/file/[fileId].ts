import { withApiAuthRequired } from '@auth0/nextjs-auth0';

import { handleApiError } from '../../../apiUtils/handleApiError';
import { restreamDownload } from '../../../apiUtils/restreamDownload';

export default withApiAuthRequired(async (req, res) => {
  const { fileId } = req.query;

  try {
    await restreamDownload(`/file/${fileId}`, req, res);
  } catch (error) {
    handleApiError(res, error);
  }
});
