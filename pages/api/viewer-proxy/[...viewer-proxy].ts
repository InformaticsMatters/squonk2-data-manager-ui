import { withSentry } from "@sentry/nextjs";
import type { NextHttpProxyMiddlewareOptions } from "next-http-proxy-middleware";

import { createProxyMiddleware } from "../../../utils/api/apiProxy";

export { config } from "../../../utils/api/apiProxy";

const target = process.env.DATA_MANAGER_API_SERVER;

if (target === undefined) {
  throw Error("Data Manager API environment variable not specified!");
}

const handleProxyInit: NextHttpProxyMiddlewareOptions["onProxyInit"] = (proxy) => {
  proxy.on("proxyRes", (proxyRes) => {
    proxyRes.headers["content-disposition"] = "inline";
  });
};

export default withSentry(createProxyMiddleware("^/api/viewer-proxy", target, handleProxyInit));
