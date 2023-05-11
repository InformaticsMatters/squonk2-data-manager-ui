import type { AccessTokenError } from "@auth0/nextjs-auth0";
import { getAccessToken } from "@auth0/nextjs-auth0";
import type { NextApiHandler, NextApiRequest, NextApiResponse } from "next";
import type { NextHttpProxyMiddlewareOptions } from "next-http-proxy-middleware";
import httpProxyMiddleware from "next-http-proxy-middleware";

type Path = `^/api/${string}`;
type Headers = NonNullable<Parameters<typeof httpProxyMiddleware>[2]>["headers"];

const getAccessTokenErrorWrapped = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    // user is logged in
    return (await getAccessToken(req, res)).accessToken;
  } catch (error) {
    if (error && (error as AccessTokenError).code !== "ERR_MISSING_SESSION") {
      // if this errors for anything other than the user being logged out, then we rethrow
      throw error;
    }
  }
  // not logged in
  // returns undefined here when not authenticated
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
      const accessToken = await getAccessTokenErrorWrapped(req, res);
      if (accessToken) {
        // add Authorization when the user is Authorized, we allow users to attempt to make
        // unauthorized requests and expect the API to block unauthorized requests where needed
        headers.Authorization = `Bearer ${accessToken}`;
      }

      // API resolved without sending a response for ..., this may result in stalled requests.
      return await httpProxyMiddleware(req, res, {
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

export const config = {
  api: {
    bodyParser: false,
    externalResolver: true, // Prevents noise created by proxy
  },
};
