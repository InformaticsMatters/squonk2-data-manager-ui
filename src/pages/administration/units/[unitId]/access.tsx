import { AdministrationWorkspace } from "../../../../administration/AdministrationWorkspace";
import { pagePolicies, withPagePolicy } from "../../../../application/pagePolicy";

const UnitAccessPage = () => <AdministrationWorkspace />;

export default withPagePolicy(pagePolicies.administration("unit-access"), UnitAccessPage);
