import { pagePolicies, withPagePolicy } from "../../../application/pagePolicy";
import { WorkspacePlaceholder } from "../../../components/workspaces/WorkspacePlaceholder";

const ProjectFilesPage = () => <WorkspacePlaceholder title="Files" />;

export default withPagePolicy(pagePolicies.projects("files"), ProjectFilesPage);
