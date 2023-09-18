import type { Response as NFResponse } from "node-fetch";

export const isResponseJson = (response: Response | NFResponse) =>
  !!response.headers.get("content-type")?.includes("application/json");
