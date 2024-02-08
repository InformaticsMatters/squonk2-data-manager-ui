import { handleAuth, handleLogin, handleProfile } from "@auth0/nextjs-auth0";
import { captureException } from "@sentry/nextjs";
import { jwtDecode } from "jwt-decode";
import type { NextApiRequest, NextApiResponse } from "next";

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
  profile: async (req: NextApiRequest, res: NextApiResponse) => {
    await handleProfile(req, res, {
      refetch: true,
      afterRefetch: (_req, _res, newSession) => {
        // add the roles from the access token to the user object
        const accessToken = newSession.accessToken;
        if (typeof accessToken !== "string") {
          return newSession;
        }

        const decodedAccessToken = jwtDecode<Record<string, any>>(accessToken);
        return {
          ...newSession,
          user: {
            ...newSession.user,
            realm_access: decodedAccessToken.realm_access,
          },
        };
      },
    });
  },
});

export const config = {
  api: {
    externalResolver: true,
  },
};
