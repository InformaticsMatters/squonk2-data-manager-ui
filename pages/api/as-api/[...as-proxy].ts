import { withSentry } from '@sentry/nextjs';

import { createProxyMiddleware } from '../../../utils/api/apiProxy';

export { config } from '../../../utils/api/apiProxy';

const target = process.env.ACCOUNT_SERVER_API_SERVER;

if (target === undefined) {
  throw Error('Account Server API environment variable not specified!');
}

export default withSentry(createProxyMiddleware(`^/api/as-api`, target));
