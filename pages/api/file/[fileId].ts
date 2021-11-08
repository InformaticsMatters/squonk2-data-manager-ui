import { withApiAuthRequired } from '@auth0/nextjs-auth0';

import { restreamDownload } from '../../../apiUtils/restreamDownload';

export default withApiAuthRequired((req, res) => {
  const { fileId } = req.query;

  restreamDownload(`/file/${fileId}`, req, res);
});
