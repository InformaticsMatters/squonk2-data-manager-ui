import { getSession, withMiddlewareAuthRequired } from "@auth0/nextjs-auth0/edge";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const DM_PATH = "/api/dm-api";
const VIEWER_PATH = "/api/viewer-proxy";
const AS_PATH = "/api/as-api";

const fmtError = (variable: string) => new Error(`Environment variable '${variable}' was not set`);

const getRewriteURL = (url: NextRequest["nextUrl"]) => {
  if (!process.env.DATA_MANAGER_API_SERVER) {
    throw fmtError("DATA_MANAGER_API_SERVER");
  }
  if (!process.env.ACCOUNT_SERVER_API_SERVER) {
    throw fmtError("ACCOUNT_SERVER_API_SERVER");
  }

  if (url.pathname.startsWith(DM_PATH)) {
    return process.env.DATA_MANAGER_API_SERVER + url.pathname.slice(DM_PATH.length) + url.search;
  }

  if (url.pathname.startsWith(VIEWER_PATH)) {
    return (
      process.env.DATA_MANAGER_API_SERVER + url.pathname.slice(VIEWER_PATH.length) + url.search
    );
  }

  if (url.pathname.startsWith(AS_PATH)) {
    return process.env.ACCOUNT_SERVER_API_SERVER + url.pathname.slice(AS_PATH.length) + url.search;
  }

  throw Error("Not a valid subpath");
};

// This function can be marked `async` if using `await` inside
export default withMiddlewareAuthRequired(async function middleware(req: NextRequest) {
  const res = new NextResponse();
  const session = await getSession(req, res);

  if (!session?.accessToken) {
    return new NextResponse(JSON.stringify({ error: "Unauthorized in the middleware" }), {
      status: 401,
      headers: { "content-type": "application/json" },
    });
  }

  const headers = new Headers({
    Authorization: `Bearer ${session.accessToken}`,
    cookie: "", // Must override the browser sent authorization code otherwise ingress gives a 400 status
  });

  if (req.nextUrl.pathname.startsWith("/api/viewer-proxy")) {
    const response = NextResponse.rewrite(getRewriteURL(req.nextUrl), {
      request: { headers },
      headers: { "content-disposition": "inline" },
    });

    response.headers.set("content-disposition-2", "inline");
    return response;
  }

  return NextResponse.rewrite(getRewriteURL(req.nextUrl), { request: { headers } });
});

// See "Matching Paths" below to learn more
export const config = {
  matcher: ["/api/dm-api/:path*", "/api/as-api/:path*", "/api/viewer-proxy/:path*"],
  api: {
    bodyParser: false,
    externalResolver: true, // Prevents noise created by proxy
  },
};
