import { withPublicPagePolicy } from "../../../application/pagePolicy";
import { withDocsPage } from "../../../components/DocsPage";
import GettingStartedContent from "../../../content/docs/how-to/getting-started.mdx";

export default withPublicPagePolicy(
  withDocsPage("/docs/how-to/getting-started", GettingStartedContent),
);
