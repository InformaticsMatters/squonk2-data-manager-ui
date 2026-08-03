import { pagePolicies, withPagePolicy } from "../../application/pagePolicy";
import { WorkspacePlaceholder } from "../../components/workspaces/WorkspacePlaceholder";

const AdministrationPage = () => <WorkspacePlaceholder title="Administration" />;

export default withPagePolicy(
  pagePolicies.administration("organisation-access"),
  AdministrationPage,
);
