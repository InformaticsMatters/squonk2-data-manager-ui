import { createProxyMiddleware } from "../../../utils/api/apiProxy";

export { config } from "../../../utils/api/apiProxy";

export const prefix = "/api/dm-api";
const target = process.env.DATA_MANAGER_API_SERVER;

if (target === undefined) {
  throw new Error("Data Manager API environment variable not specified!");
}

export default createProxyMiddleware(`^${prefix}`, target);
