import { AdministrationWorkspace } from "../../../../administration/AdministrationWorkspace";
import { pagePolicies, withPagePolicy } from "../../../../application/pagePolicy";

const OrganisationAccessResourcePage = () => <AdministrationWorkspace />;

export default withPagePolicy(
  pagePolicies.administration("organisation-access"),
  OrganisationAccessResourcePage,
);
