import { withPublicPagePolicy } from "../../../application/pagePolicy";
import { withDocsPage } from "../../../components/DocsPage";
import ProjectsContent from "../../../content/docs/how-to/projects.mdx";

export default withPublicPagePolicy(withDocsPage("/docs/how-to/projects", ProjectsContent));
