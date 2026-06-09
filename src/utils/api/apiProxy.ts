import { fromNodeHeaders } from "better-auth/node";
import { type NextApiHandler, type NextApiRequest } from "next";
import httpProxyMiddleware, {
  type NextHttpProxyMiddlewareOptions,
} from "next-http-proxy-middleware";

import { auth } from "../../lib/auth";

type Path = `^/api/${string}`;
type Headers = NonNullable<Parameters<typeof httpProxyMiddleware>[2]>["headers"];

const getAccessTokenErrorWrapped = async (req: NextApiRequest) => {
  try {
    const result = await auth.api.getAccessToken({
      body: { providerId: "keycloak" },
      headers: fromNodeHeaders(req.headers),
    });
    return result.accessToken;
  } catch {
    // User is not logged in — return undefined to allow unauthenticated requests
    return undefined;
  }
};

export const createProxyMiddleware = (
  patternStr: Path,
  target: string,
  handleProxyInit: NextHttpProxyMiddlewareOptions["onProxyInit"] = undefined,
) => {
  const api: NextApiHandler = async (req, res) => {
    try {
      const headers: Headers = {
        cookie: "", // Must override the browser sent authorization code otherwise ingress gives a 400 status
      };
      const accessToken = await getAccessTokenErrorWrapped(req);
      if (accessToken) {
        // add Authorization when the user is Authorized, we allow users to attempt to make
        // unauthorized requests and expect the API to block unauthorized requests where needed
        headers.Authorization = `Bearer ${accessToken}`;
      }

      // API resolved without sending a response for ..., this may result in stalled requests.
      await httpProxyMiddleware(req, res, {
        target,
        onProxyInit: handleProxyInit,
        // * replace the path in the request with the correct path for the API
        pathRewrite: [{ patternStr, replaceStr: "" }],
        headers,
        secure: !process.env.DANGEROUS__DISABLE_SSL_CERT_CHECK_IN_API_PROXY, // only used in testing
      });
    } catch (error) {
      console.error(error);
      res.status(500).json(error);
    }
  };
  return api;
};
