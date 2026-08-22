import { AdministrationWorkspace } from "../../administration/AdministrationWorkspace";
import { pagePolicies, withPagePolicy } from "../../application/pagePolicy";

const OrganisationUsagePage = () => <AdministrationWorkspace />;

export default withPagePolicy(
  pagePolicies.administration("organisation-usage"),
  OrganisationUsagePage,
);
