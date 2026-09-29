import { withPublicPagePolicy } from "../../../application/pagePolicy";
import { withDocsPage } from "../../../components/DocsPage";
import DatasetsContent from "../../../content/docs/how-to/datasets.mdx";

export default withPublicPagePolicy(withDocsPage("/docs/how-to/datasets", DatasetsContent));
