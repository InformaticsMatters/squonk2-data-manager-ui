import { AdministrationWorkspace } from "../../../../administration/AdministrationWorkspace";
import { pagePolicies, withPagePolicy } from "../../../../application/pagePolicy";

const UsageInventoryResourcePage = () => <AdministrationWorkspace />;

export default withPagePolicy(
  pagePolicies.administration("usage-inventory"),
  UsageInventoryResourcePage,
);
