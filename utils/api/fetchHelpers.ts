import { type Response as NFResponse } from "node-fetch";

export const isResponseJson = (response: NFResponse | Response) =>
  !!response.headers.get("content-type")?.includes("application/json");
