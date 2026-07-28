export type { ErrorType } from "../runtime/account-server/axios";
export {
  AXIOS_INSTANCE,
  customInstance,
  setAuthToken,
  setBaseUrl,
} from "../runtime/account-server/axios";
export { customFetch, getBaseURL, setBaseURL } from "../runtime/account-server/fetch";
export * from "./generated/api-schemas";
