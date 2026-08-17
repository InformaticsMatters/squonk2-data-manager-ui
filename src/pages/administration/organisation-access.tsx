import { AdministrationWorkspace } from "../../administration/AdministrationWorkspace";
import { pagePolicies, withPagePolicy } from "../../application/pagePolicy";

const OrganisationAccessPage = () => <AdministrationWorkspace />;

export default withPagePolicy(
  pagePolicies.administration("organisation-access"),
  OrganisationAccessPage,
);
