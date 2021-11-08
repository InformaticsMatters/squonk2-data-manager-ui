import { withApiAuthRequired } from '@auth0/nextjs-auth0';

import { restreamDownload } from '../../../../apiUtils/restreamDownload';

export default withApiAuthRequired((req, res) => {
  const { datasetId, datasetVersion } = req.query;

  restreamDownload(`/dataset/${datasetId}/${datasetVersion}`, req, res);
});
