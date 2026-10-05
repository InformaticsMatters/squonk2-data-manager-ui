import { type NextApiHandler } from "next";
import { type NextHttpProxyMiddlewareOptions } from "next-http-proxy-middleware";

import { projectFileResourcePath } from "../../../projects/routes";
import { createProxyMiddleware } from "../../../utils/api/apiProxy";

export const config = {
  api: {
    bodyParser: false,
    externalResolver: true, // Prevents noise created by proxy
  },
};

export const prefix = "/api/viewer-proxy";
const target = process.env.DATA_MANAGER_API_SERVER;

if (target === undefined) {
  throw new Error("Data Manager API environment variable not specified!");
}

// Force the content disposition on the response to be inline so the browser displays it in browser
const handleProxyInit: NextHttpProxyMiddlewareOptions["onProxyInit"] = (proxy) => {
  proxy.on("proxyRes", (proxyRes) => {
    proxyRes.headers["content-disposition"] = "inline";
  });
};

const proxy = createProxyMiddleware(`^${prefix}`, target, handleProxyInit);

const projectFilePath = new RegExp(`^${prefix}/project/([^/?]+)/files(/[^?]*)`, "u");

/**
 * Project files arrive spelled as a path (see `projectFileBrowserPath`) so relative references in a
 * rendered document resolve beside it; the Data Manager only knows the query form, so translate.
 * A path that names no file of a project answers 404 here rather than reaching the Data Manager.
 */
const handler: NextApiHandler = (req, res) => {
  const match = projectFilePath.exec(req.url ?? "");
  if (match) {
    const [, projectId, encodedPath] = match;
    try {
      const path = encodedPath
        .split("/")
        .map((name) => decodeURIComponent(name))
        .join("/");
      req.url = `${prefix}${projectFileResourcePath(projectId, path)}`;
    } catch {
      res.status(404).end();
      return;
    }
  }
  return proxy(req, res);
};

export default handler;
