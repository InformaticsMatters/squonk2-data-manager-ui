import { AdministrationWorkspace } from "../../../../administration/AdministrationWorkspace";
import { pagePolicies, withPagePolicy } from "../../../../application/pagePolicy";

const UnitChargesPage = () => <AdministrationWorkspace />;

export default withPagePolicy(pagePolicies.administration("unit-charges"), UnitChargesPage);
