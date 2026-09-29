import { withPublicPagePolicy } from "../../../../application/pagePolicy";
import { withDocsPage } from "../../../../components/DocsPage";
import ProjectResultsContent from "../../../../content/docs/how-to/projects/results.mdx";

export default withPublicPagePolicy(
  withDocsPage("/docs/how-to/projects/results", ProjectResultsContent),
);
