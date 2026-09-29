import { captureException } from "@sentry/nextjs";

import { withBasePath } from "../utils/app/basePath";

/**
 * Where this deployment's APIs are.
 *
 * These addresses are deployment configuration, not build configuration: the image is built once
 * and run by whichever installation deploys it, each against its own APIs. `NEXT_PUBLIC_` values
 * are inlined by `next build`, so they can only carry what a build was told and a published image
 * has no way to correct them. The server reads the addresses from its own environment, where an
 * installation puts them, and the browser asks the server that served the page.
 */
export interface ApiServers {
  dataManager: string;
  accountServer: string;
  depict: string;
}

type Environment = Record<string, string | undefined>;

export const API_SERVERS_PATH = "/api/configuration/api-servers";

const UNCONFIGURED: ApiServers = { dataManager: "", accountServer: "", depict: "" };

// The deployment-facing name is the one an installation sets. Its `NEXT_PUBLIC_` twin answers for
// a build that was handed the addresses — a Vercel deployment — where the two agree anyway.
// An empty value counts as unset: `.env` derives one name from the other, and a variable the
// environment never supplied expands to an empty string rather than going missing.
const read = (env: Environment, name: string): string =>
  [env[name], env[`NEXT_PUBLIC_${name}`]].find((value) => !!value) ?? "";

export const readApiServers = (env: Environment): ApiServers => ({
  dataManager: read(env, "DATA_MANAGER_API_SERVER"),
  accountServer: read(env, "ACCOUNT_SERVER_API_SERVER"),
  depict: read(env, "DEPICT_API_SERVER"),
});

let loaded: ApiServers | undefined;
let inFlight: Promise<ApiServers> | undefined;

/**
 * The addresses if they have already arrived, so a caller that mounts after the first load renders
 * with them rather than flashing an unconfigured view on its way to the same answer.
 */
export const apiServersSnapshot = (): ApiServers | undefined => loaded;

/**
 * Asks the server where its APIs are, once per tab. Every caller shares the one request.
 */
export const loadApiServers = (fetcher: typeof fetch = fetch): Promise<ApiServers> => {
  inFlight ??= fetcher(withBasePath(API_SERVERS_PATH))
    .then(async (response) => {
      if (!response.ok) {
        throw new Error(`The API server addresses could not be read: ${response.status}`);
      }
      loaded = (await response.json()) as ApiServers;
      return loaded;
    })
    .catch((error: unknown) => {
      // A deployment whose own server cannot say where its APIs are is broken in a way that signing
      // in again would not mend, so this resolves rather than rejects: the auth recovery in
      // ApiClientReadyBoundary is left for the failures it can actually recover from. Clearing the
      // shared promise lets the next caller ask again.
      captureException(error);
      inFlight = undefined;
      return UNCONFIGURED;
    });

  return inFlight;
};
