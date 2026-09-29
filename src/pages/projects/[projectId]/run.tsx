import { pagePolicies, withPagePolicy } from "../../../application/pagePolicy";
import { ProjectRun } from "../../../projects/ProjectRun";

export default withPagePolicy(pagePolicies.projects("run"), ProjectRun);
