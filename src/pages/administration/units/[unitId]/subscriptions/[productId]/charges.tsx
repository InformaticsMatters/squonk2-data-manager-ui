import { AdministrationWorkspace } from "../../../../../../administration/AdministrationWorkspace";
import { pagePolicies, withPagePolicy } from "../../../../../../application/pagePolicy";

const SubscriptionChargesPage = () => <AdministrationWorkspace />;

export default withPagePolicy(
  pagePolicies.administration("subscription-charges"),
  SubscriptionChargesPage,
);
