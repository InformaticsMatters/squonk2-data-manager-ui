import { handleAuth, handleLogin } from "@auth0/nextjs-auth0";
import { captureException } from "@sentry/nextjs";

export default handleAuth({
  login: handleLogin({
    authorizationParams: {
      // Add the `offline_access` scope to also get a Refresh Token
      scope: "openid profile email offline_access",
    },
  }),
  onError(_req, res, error) {
    console.error(error);
    res.status(error.status || 500).end();
    captureException(error);
  },
});

export const config = {
  api: {
    externalResolver: true,
  },
};
