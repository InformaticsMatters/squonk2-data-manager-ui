import { withPublicPagePolicy } from "../../application/pagePolicy";
import { withDocsPage } from "../../components/DocsPage";
import ConceptsContent from "../../content/docs/concepts.mdx";

export default withPublicPagePolicy(withDocsPage("/docs/concepts", ConceptsContent));
