import { withPublicPagePolicy } from "../../application/pagePolicy";
import { withDocsPage } from "../../components/DocsPage";
import DeveloperContent from "../../content/docs/developer.mdx";

export default withPublicPagePolicy(withDocsPage("/docs/developer", DeveloperContent));
