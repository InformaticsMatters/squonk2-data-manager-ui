import { pagePolicies, withPagePolicy } from "../../application/pagePolicy";
import { WorkspacePlaceholder } from "../../components/workspaces/WorkspacePlaceholder";

const NewProjectPage = () => <WorkspacePlaceholder title="Create project" />;

export default withPagePolicy(pagePolicies.projects("create"), NewProjectPage);
