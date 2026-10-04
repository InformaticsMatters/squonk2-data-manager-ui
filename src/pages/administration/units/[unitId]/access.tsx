import { pagePolicies, withPagePolicy } from "../../../../application/pagePolicy";

// The family shell renders the workspace this address names; the page itself is only the address.
const UnitAccessPage = () => null;

export default withPagePolicy(pagePolicies.administration("unit-access"), UnitAccessPage);
