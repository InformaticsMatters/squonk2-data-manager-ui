import { pagePolicies, withPagePolicy } from "../../../application/pagePolicy";
import { ProjectDeletionProgress } from "../../../projects/ProjectDeletionProgress";

const ProjectDeletionPage = () => <ProjectDeletionProgress />;

export default withPagePolicy(pagePolicies.projects("deletion"), ProjectDeletionPage);
