import { pagePolicies, withPagePolicy } from "../../application/pagePolicy";
import { WorkspacePlaceholder } from "../../components/workspaces/WorkspacePlaceholder";

const ChargesPage = () => <WorkspacePlaceholder title="Charges" />;

export default withPagePolicy(pagePolicies.administration("charges"), ChargesPage);
