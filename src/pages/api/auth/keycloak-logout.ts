import { fromNodeHeaders } from "better-auth/node";
import { type NextApiHandler } from "next";

import { auth } from "../../../lib/auth";
import { withBasePath } from "../../../utils/app/basePath";

/**
 * Reads the ID token Keycloak issued for this session.
 *
 * Better Auth's own `signOut` builds the provider logout URL from the account it finds through the
 * database adapter, and this deployment configures no database: the provider's tokens live in a
 * signed cookie instead, which only a caller naming that source is given. So the token is read here
 * and handed to the provider below, which keeps the logout working on any instance that receives
 * the request rather than only on the one that signed the caller in.
 */
const readIdToken = async (headers: Headers) => {
  try {
    const { idToken } = await auth.api.getAccessToken({
      body: { useAccountCookie: true },
      headers,
    });
    return idToken;
  } catch {
    // Nobody is signed in here any more, or Keycloak would not renew this account's tokens. The
    // logout carries on either way: whatever session the browser still holds is worth ending.
    return undefined;
  }
};

/**
 * Ends the session in this application and then at Keycloak, in one navigation.
 *
 * The ID token travels as `id_token_hint`, which is what lets Keycloak end the session and return
 * the caller here directly. Without it Keycloak stops at a confirmation page it themes itself, and
 * a realm whose theme hides that page's confirm button leaves the caller stranded.
 */
const handler: NextApiHandler = async (req, res) => {
  if (req.method !== "GET") {
    res.status(405).end("Method not allowed");
    return;
  }

  const headers = fromNodeHeaders(req.headers);
  const idToken = await readIdToken(headers);

  // Sign out first, so the browser leaves with the session cookies already cleared and a logout
  // that stops at Keycloak still ends the session here.
  const signOutResponse = await auth.api.signOut({ headers, asResponse: true });
  const setCookies = signOutResponse.headers.getSetCookie();
  if (setCookies.length > 0) {
    res.setHeader("Set-Cookie", setCookies);
  }

  const { socialProviders } = await auth.$context;
  const keycloak = socialProviders.find((provider) => provider.id === "keycloak");
  const endSessionUrl = await keycloak?.createEndSessionURL?.({ idToken });

  // A deployment whose discovery document carries no `end_session_endpoint` cannot be asked to end
  // the provider's session; the local one is already gone, so the caller goes to public Home.
  res.redirect(302, endSessionUrl?.href ?? withBasePath("/"));
};

export default handler;
