import { AdministrationWorkspace } from "../../../../administration/AdministrationWorkspace";
import { pagePolicies, withPagePolicy } from "../../../../application/pagePolicy";

const UnitUsagePage = () => <AdministrationWorkspace />;

export default withPagePolicy(pagePolicies.administration("unit-usage"), UnitUsagePage);
