import { pagePolicies, withPagePolicy } from "../../../application/pagePolicy";
import { WorkspacePlaceholder } from "../../../components/workspaces/WorkspacePlaceholder";

const ProjectResultsPage = () => <WorkspacePlaceholder title="Results" />;

export default withPagePolicy(pagePolicies.projects("results"), ProjectResultsPage);
