import { withPublicPagePolicy } from "../../application/pagePolicy";
import { withDocsPage } from "../../components/DocsPage";
import DocsIndexContent from "../../content/docs/index.mdx";

export default withPublicPagePolicy(withDocsPage("/docs", DocsIndexContent));
