import { AdministrationWorkspace } from "../../../administration/AdministrationWorkspace";
import { pagePolicies, withPagePolicy } from "../../../application/pagePolicy";

const SubscriptionEntryPage = () => <AdministrationWorkspace />;

export default withPagePolicy(
  pagePolicies.administration("subscription-entry"),
  SubscriptionEntryPage,
);
