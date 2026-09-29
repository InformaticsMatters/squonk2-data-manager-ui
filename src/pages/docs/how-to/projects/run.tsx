import { withPublicPagePolicy } from "../../../../application/pagePolicy";
import { withDocsPage } from "../../../../components/DocsPage";
import ProjectRunContent from "../../../../content/docs/how-to/projects/run.mdx";

export default withPublicPagePolicy(withDocsPage("/docs/how-to/projects/run", ProjectRunContent));
