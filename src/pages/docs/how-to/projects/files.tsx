import { withPublicPagePolicy } from "../../../../application/pagePolicy";
import { withDocsPage } from "../../../../components/DocsPage";
import ProjectFilesContent from "../../../../content/docs/how-to/projects/files.mdx";

export default withPublicPagePolicy(
  withDocsPage("/docs/how-to/projects/files", ProjectFilesContent),
);
