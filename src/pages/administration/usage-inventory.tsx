import { pagePolicies, withPagePolicy } from "../../application/pagePolicy";
import { WorkspacePlaceholder } from "../../components/workspaces/WorkspacePlaceholder";

const UsageInventoryPage = () => <WorkspacePlaceholder title="Usage & inventory" />;

export default withPagePolicy(pagePolicies.administration("usage-inventory"), UsageInventoryPage);
