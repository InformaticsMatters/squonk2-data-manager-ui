import { pagePolicies, withPagePolicy } from "../../../application/pagePolicy";
import { WorkspacePlaceholder } from "../../../components/workspaces/WorkspacePlaceholder";

const ProjectRunPage = () => <WorkspacePlaceholder title="Run" />;

export default withPagePolicy(pagePolicies.projects("run"), ProjectRunPage);
