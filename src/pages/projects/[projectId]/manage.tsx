import { pagePolicies, withPagePolicy } from "../../../application/pagePolicy";
import { ProjectManage } from "../../../projects/ProjectManage";

export default withPagePolicy(pagePolicies.projects("manage"), ProjectManage);
