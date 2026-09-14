import { withPublicPagePolicy } from "../../../application/pagePolicy";
import { withDocsPage } from "../../../components/DocsPage";
import LoginContent from "../../../content/docs/how-to/login.mdx";

export default withPublicPagePolicy(withDocsPage("/docs/how-to/login", LoginContent));
