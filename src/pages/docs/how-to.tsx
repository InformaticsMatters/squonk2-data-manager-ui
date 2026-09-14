import { withPublicPagePolicy } from "../../application/pagePolicy";
import { withDocsPage } from "../../components/DocsPage";
import HowToContent from "../../content/docs/how-to.mdx";

export default withPublicPagePolicy(withDocsPage("/docs/how-to", HowToContent));
