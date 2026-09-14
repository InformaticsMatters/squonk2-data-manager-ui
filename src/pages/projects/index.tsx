import { pagePolicies, withPagePolicy } from "../../application/pagePolicy";
import { ProjectsIndex } from "../../components/workspaces/ProjectsIndex";

export default withPagePolicy(pagePolicies.projects("index"), ProjectsIndex);
