import { pagePolicies, withPagePolicy } from "../../application/pagePolicy";
import { ProjectCreate } from "../../projects/ProjectCreate";

const NewProjectPage = () => <ProjectCreate />;

export default withPagePolicy(pagePolicies.projects("create"), NewProjectPage);
