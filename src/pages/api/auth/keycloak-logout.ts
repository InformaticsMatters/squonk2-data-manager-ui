import { type NextApiHandler } from "next";

import { withBasePath } from "../../../utils/app/basePath";

const handler: NextApiHandler = (req, res) => {
  if (req.method !== "GET") {
    res.status(405).end("Method not allowed");
    return;
  }

  const baseUrl = process.env.BETTER_AUTH_BASE_URL;
  const clientId = process.env.KEYCLOAK_CLIENT_ID;
  const issuer = process.env.KEYCLOAK_ISSUER_URL;
  if (!baseUrl || !clientId || !issuer) {
    res.status(503).end("Logout is not configured");
    return;
  }

  const logoutUrl = new URL(`${issuer.replace(/\/+$/u, "")}/protocol/openid-connect/logout`);
  logoutUrl.searchParams.set("post_logout_redirect_uri", new URL(withBasePath("/"), baseUrl).href);
  logoutUrl.searchParams.set("client_id", clientId);
  res.redirect(302, logoutUrl.href);
};

export default handler;
