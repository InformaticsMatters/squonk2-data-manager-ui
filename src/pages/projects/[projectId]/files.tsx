import { pagePolicies, withPagePolicy } from "../../../application/pagePolicy";
import { ProjectFiles } from "../../../projects/ProjectFiles";

export default withPagePolicy(pagePolicies.projects("files"), ProjectFiles);
