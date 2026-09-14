import { pagePolicies, withPagePolicy } from "../../../../../application/pagePolicy";
import { DatasetsWorkspace } from "../../../../../datasets/DatasetsWorkspace";

export default withPagePolicy(pagePolicies.datasets("detail"), DatasetsWorkspace);
