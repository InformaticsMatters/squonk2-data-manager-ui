import { pagePolicies, withPagePolicy } from "../../application/pagePolicy";

// The family shell renders the workspace this address names; the page itself is only the address.
const OrganisationChargesPage = () => null;

export default withPagePolicy(
  pagePolicies.administration("organisation-charges"),
  OrganisationChargesPage,
);
