import { pagePolicies, withPagePolicy } from "../../../application/pagePolicy";
import { WorkspacePlaceholder } from "../../../components/workspaces/WorkspacePlaceholder";

const ProjectManagePage = () => <WorkspacePlaceholder title="Manage" />;

export default withPagePolicy(pagePolicies.projects("manage"), ProjectManagePage);
