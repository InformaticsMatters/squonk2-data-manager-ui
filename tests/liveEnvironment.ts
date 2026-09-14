import { existsSync } from "node:fs";
import path from "node:path";

// Local runs keep their secrets in this (gitignored) file; CI passes the same values as job-level
// environment variables and has no file to load. `process.loadEnvFile` throws on a missing path,
// unlike the `dotenv` call it replaced, so the existence check is what keeps CI working.
const localEnvironment = path.resolve(__dirname, "../.env.test.local");
if (existsSync(localEnvironment)) {
  process.loadEnvFile(localEnvironment);
}

export const livePort = process.env.TEST_PORT ?? "3000";

const url = new URL(process.env.BASE_URL as string);
url.pathname = process.env.BASE_PATH ?? "/";
url.port = livePort;

/** Where the production server under test is served, base path and all. */
export const liveBaseURL = url.href;

/**
 * The identity both live suites sign in as. The smoke suite only reads through it; the journey
 * lives as it, and clears its projects, subscriptions and personal unit before every run.
 *
 * Only the password comes from the environment, and it is named here rather than passed under a
 * generic name, so one place answers "which account does the live testing touch?".
 */
export const liveUser = {
  passwordVariable: "DMIT_USER_A_PASSWORD",
  username: "dmit-user-a",
} as const;

/** The password an identity signs in with, which only ever lives in the environment. */
export const passwordFor = ({ passwordVariable }: { passwordVariable: string }) =>
  process.env[passwordVariable];
