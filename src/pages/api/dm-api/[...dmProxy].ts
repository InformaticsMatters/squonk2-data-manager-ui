import { createProxyMiddleware } from "../../../utils/api/apiProxy";

export const config = {
  api: {
    bodyParser: false,
    externalResolver: true, // Prevents noise created by proxy
  },
};

export const prefix = "/api/dm-api";
const target = process.env.DATA_MANAGER_API_SERVER;

if (target === undefined) {
  throw new Error("Data Manager API environment variable not specified!");
}

export default createProxyMiddleware(`^${prefix}`, target);
