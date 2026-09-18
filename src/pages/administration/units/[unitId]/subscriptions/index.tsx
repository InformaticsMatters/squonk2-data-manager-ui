import { AdministrationWorkspace } from "../../../../../administration/AdministrationWorkspace";
import { pagePolicies, withPagePolicy } from "../../../../../application/pagePolicy";

const UnitSubscriptionsPage = () => <AdministrationWorkspace />;

export default withPagePolicy(
  pagePolicies.administration("unit-subscriptions"),
  UnitSubscriptionsPage,
);
