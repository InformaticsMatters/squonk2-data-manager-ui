import { withPublicPagePolicy } from "../../../application/pagePolicy";
import { withDocsPage } from "../../../components/DocsPage";
import AdministrationContent from "../../../content/docs/how-to/administration.mdx";

export default withPublicPagePolicy(
  withDocsPage("/docs/how-to/administration", AdministrationContent),
);
