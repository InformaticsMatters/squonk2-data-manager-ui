import { pagePolicies, withPagePolicy } from "../../application/pagePolicy";
import { WorkspacePlaceholder } from "../../components/workspaces/WorkspacePlaceholder";

const SubscriptionsPage = () => <WorkspacePlaceholder title="Subscriptions" />;

export default withPagePolicy(pagePolicies.administration("subscriptions"), SubscriptionsPage);
