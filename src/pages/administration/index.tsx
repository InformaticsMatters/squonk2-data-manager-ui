import { AdministrationWorkspace } from "../../administration/AdministrationWorkspace";
import { pagePolicies, withPagePolicy } from "../../application/pagePolicy";

const OrganisationOverviewPage = () => <AdministrationWorkspace />;

export default withPagePolicy(pagePolicies.administration("overview"), OrganisationOverviewPage);
