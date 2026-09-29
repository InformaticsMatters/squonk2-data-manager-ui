import { AdministrationWorkspace } from "../../../../administration/AdministrationWorkspace";
import { pagePolicies, withPagePolicy } from "../../../../application/pagePolicy";

const UnitEntryPage = () => <AdministrationWorkspace />;

export default withPagePolicy(pagePolicies.administration("unit-access"), UnitEntryPage);
