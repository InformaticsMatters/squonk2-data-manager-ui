/**
 * Everything the live journey knows about the deployment it runs against, pinned rather than
 * discovered. Discovery would make "this deployment no longer offers an application" and "the Run
 * catalogue is broken" look like the same failure.
 */
export const journeyDeployment = {
  /** The application is only ever asserted to be running: a live notebook spends coins. */
  application: "JupyterNotebook",
  /** A built-in job that does nothing and succeeds, so following it to the end costs almost no coins. */
  job: "nop",
  projectName: "live-journey",
  tier: "Evaluation",
  /** A workflow whose steps are built-in test jobs, so it depends on nothing else in the deployment. */
  workflow: "isolated-linear-im-test",
} as const;

/**
 * The identity the journey lives as, and whose projects, subscriptions and personal unit
 * preparation clears before every run. It is the same identity the smoke suite signs in as, named
 * once for both.
 */
export { liveUser as journeyUser } from "../liveEnvironment";

/**
 * The neighbours the journey shares its project with: real identities on the deployment, named
 * here rather than found, and given the role the journey grants them. The deployment holds one
 * test identity the journey user can share with, so the journey grants one role rather than the
 * three the ADR assumed.
 */
export const journeyCollaborators = [
  { passwordVariable: "DMIT_USER_B_PASSWORD", role: "editor", username: "dmit-user-b" },
] as const;
