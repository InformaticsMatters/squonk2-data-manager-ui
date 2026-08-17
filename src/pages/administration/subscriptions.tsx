import { AdministrationWorkspace } from "../../administration/AdministrationWorkspace";
import { pagePolicies, withPagePolicy } from "../../application/pagePolicy";

const SubscriptionsPage = () => <AdministrationWorkspace />;

export default withPagePolicy(pagePolicies.administration("subscriptions"), SubscriptionsPage);
