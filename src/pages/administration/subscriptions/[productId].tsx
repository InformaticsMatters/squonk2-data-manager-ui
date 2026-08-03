import { AdministrationWorkspace } from "../../../administration/AdministrationWorkspace";
import { pagePolicies, withPagePolicy } from "../../../application/pagePolicy";

const SubscriptionPage = () => <AdministrationWorkspace />;

export default withPagePolicy(pagePolicies.administration("subscriptions"), SubscriptionPage);
