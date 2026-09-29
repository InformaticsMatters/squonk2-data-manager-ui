import { pagePolicies, withPagePolicy } from "../../../../application/pagePolicy";
import { ProjectRun } from "../../../../projects/ProjectRun";

/**
 * Every URL beneath a project's Run section, canonical or not. One entry serves them all so a
 * definition route and a mistyped path beneath Run reach the same section, which then answers for
 * the one it was given rather than letting the project frame disappear.
 */
export default withPagePolicy(pagePolicies.projects("run"), ProjectRun);
