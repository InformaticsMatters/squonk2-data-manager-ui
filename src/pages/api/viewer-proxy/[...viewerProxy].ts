import { type NextHttpProxyMiddlewareOptions } from "next-http-proxy-middleware";

import { createProxyMiddleware } from "../../../utils/api/apiProxy";

export { config } from "../../../utils/api/apiProxy";

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

export default createProxyMiddleware(`^${prefix}`, target, handleProxyInit);
