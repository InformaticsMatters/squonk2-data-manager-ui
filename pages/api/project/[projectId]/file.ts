import { withApiAuthRequired } from '@auth0/nextjs-auth0';

import { handleApiError } from '../../../../utils/api/handleApiError';
import { restreamDownload } from '../../../../utils/api/restreamDownload';
import { getQueryParams } from '../../../../utils/requestUtils';

export default withApiAuthRequired(async (req, res) => {
  const { projectId, path, file } = req.query;

  try {
    await restreamDownload(`/project/${projectId}/file${getQueryParams({ path, file })}`, req, res);
  } catch (error) {
    handleApiError(res, error);
  }
});
