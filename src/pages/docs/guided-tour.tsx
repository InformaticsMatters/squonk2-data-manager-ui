import { withPublicPagePolicy } from "../../application/pagePolicy";
import { withDocsPage } from "../../components/DocsPage";
import GuidedTourContent from "../../content/docs/guided-tour.mdx";

export default withPublicPagePolicy(withDocsPage("/docs/guided-tour", GuidedTourContent));
