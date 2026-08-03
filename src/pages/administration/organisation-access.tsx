import { pagePolicies, withPagePolicy } from "../../application/pagePolicy";
import { WorkspacePlaceholder } from "../../components/workspaces/WorkspacePlaceholder";

const OrganisationAccessPage = () => <WorkspacePlaceholder title="Organisation & access" />;

export default withPagePolicy(
  pagePolicies.administration("organisation-access"),
  OrganisationAccessPage,
);
