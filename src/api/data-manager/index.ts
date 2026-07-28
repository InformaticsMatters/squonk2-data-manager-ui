export type { ErrorType } from "../runtime/data-manager/axios";
export {
  AXIOS_INSTANCE,
  customInstance,
  setAuthToken,
  setBaseUrl,
} from "../runtime/data-manager/axios";
export { customFetch, getBaseURL, setBaseURL } from "../runtime/data-manager/fetch";
export * from "./generated/api-schemas";
