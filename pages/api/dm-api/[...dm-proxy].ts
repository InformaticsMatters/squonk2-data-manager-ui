import { withSentry } from '@sentry/nextjs';

import { createProxyMiddleware } from '../../../utils/api/apiProxy';

export { config } from '../../../utils/api/apiProxy';

const target = process.env.DATA_MANAGER_API_SERVER;

if (target === undefined) {
  throw Error('Data Manager API environment variable not specified!');
}

export default withSentry(createProxyMiddleware(`^/api/dm-api`, target));
