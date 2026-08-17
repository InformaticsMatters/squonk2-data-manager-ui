import { AdministrationWorkspace } from "../../administration/AdministrationWorkspace";
import { pagePolicies, withPagePolicy } from "../../application/pagePolicy";

const UsageInventoryPage = () => <AdministrationWorkspace />;

export default withPagePolicy(pagePolicies.administration("usage-inventory"), UsageInventoryPage);
