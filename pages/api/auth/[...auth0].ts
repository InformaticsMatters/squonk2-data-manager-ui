import { handleAuth, handleLogin } from '@auth0/nextjs-auth0';
import { withSentry } from '@sentry/nextjs';

export default withSentry(
  handleAuth({
    async login(req, res) {
      try {
        await handleLogin(req, res, {
          authorizationParams: {
            // Add the `offline_access` scope to also get a Refresh Token
            scope: 'openid profile email offline_access',
          },
        });
      } catch (error) {
        res
          .status((error as Error & { status: number }).status || 400)
          .end((error as Error).message);
      }
    },
  }),
);
