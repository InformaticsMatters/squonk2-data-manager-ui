import { getAccessToken, withApiAuthRequired } from '@auth0/nextjs-auth0';
import httpProxyMiddleware from 'next-http-proxy-middleware';

type Path = `^/api/${string}`;

export const createProxyMiddleware = (patternStr: Path, target: string) =>
  withApiAuthRequired(async (req, res) => {
    try {
      const { accessToken } = await getAccessToken(req, res);

      if (accessToken === undefined) throw Error('no access token was retrieved');

      // API resolved without sending a response for ..., this may result in stalled requests.
      return await httpProxyMiddleware(req, res, {
        target,
        pathRewrite: [{ patternStr, replaceStr: '' }],
        headers: {
          Authorization: `Bearer ${accessToken}`,
          cookie: '', // Must override the browser sent authorization code otherwise ingress gives a 400 status
        },
      });
    } catch (error) {
      console.error(error);
      res.status(500).json(error);
    }
  });

export const config = {
  api: {
    bodyParser: false,
    externalResolver: true, // Prevents noise created by proxy
  },
};
