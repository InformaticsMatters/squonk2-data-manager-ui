import { withPublicPagePolicy } from "../../../../application/pagePolicy";
import { withDocsPage } from "../../../../components/DocsPage";
import ProjectManageContent from "../../../../content/docs/how-to/projects/manage.mdx";

export default withPublicPagePolicy(
  withDocsPage("/docs/how-to/projects/manage", ProjectManageContent),
);
