import { createProxyMiddleware } from "../../../utils/api/apiProxy";

export { config } from "../../../utils/api/apiProxy";

export const prefix = "/api/as-api";
const target = process.env.ACCOUNT_SERVER_API_SERVER;

if (target === undefined) {
  throw new Error("Account Server API environment variable not specified!");
}

export default createProxyMiddleware(`^${prefix}`, target);
