import { withPublicPagePolicy } from "../../application/pagePolicy";
import { withDocsPage } from "../../components/DocsPage";
import JobsContent from "../../content/docs/jobs.mdx";

export default withPublicPagePolicy(withDocsPage("/docs/jobs", JobsContent));
