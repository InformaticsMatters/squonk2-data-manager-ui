import { AdministrationWorkspace } from "../../administration/AdministrationWorkspace";
import { pagePolicies, withPagePolicy } from "../../application/pagePolicy";

const AdministrationPage = () => <AdministrationWorkspace />;

export default withPagePolicy(
  pagePolicies.administration("organisation-access"),
  AdministrationPage,
);
