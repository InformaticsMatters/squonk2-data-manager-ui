import { pagePolicies, withPagePolicy } from "../../../../../application/pagePolicy";
import { ProjectResults } from "../../../../../projects/ProjectResults";

export default withPagePolicy(pagePolicies.projects("results"), ProjectResults);
