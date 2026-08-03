import { AdministrationWorkspace } from "../../administration/AdministrationWorkspace";
import { pagePolicies, withPagePolicy } from "../../application/pagePolicy";

const ChargesPage = () => <AdministrationWorkspace />;

export default withPagePolicy(pagePolicies.administration("charges"), ChargesPage);
