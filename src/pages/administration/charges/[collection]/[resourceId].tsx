import { AdministrationWorkspace } from "../../../../administration/AdministrationWorkspace";
import { pagePolicies, withPagePolicy } from "../../../../application/pagePolicy";

const ChargeResourcePage = () => <AdministrationWorkspace />;

export default withPagePolicy(pagePolicies.administration("charges"), ChargeResourcePage);
