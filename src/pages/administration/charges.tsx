import { AdministrationWorkspace } from "../../administration/AdministrationWorkspace";
import { pagePolicies, withPagePolicy } from "../../application/pagePolicy";

const OrganisationChargesPage = () => <AdministrationWorkspace />;

export default withPagePolicy(
  pagePolicies.administration("organisation-charges"),
  OrganisationChargesPage,
);
