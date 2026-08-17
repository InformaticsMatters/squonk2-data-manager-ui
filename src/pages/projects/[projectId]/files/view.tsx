import { type GetServerSideProps } from "nextjs-routes";

import { pagePolicies, withPagePolicy } from "../../../../application/pagePolicy";
import {
  defaultFileViewer,
  isCompressedFileName,
  isFileViewer,
  resolveFileViewerDelivery,
} from "../../../../projects/fileViewers";
import {
  ProjectFileViewer,
  type ProjectFileViewerProps,
} from "../../../../projects/ProjectFileViewer";
import { projectFileResourcePath, readProjectFileAddress } from "../../../../projects/routes";
import { plaintextViewerSSR, probeViewerResource } from "../../../../utils/api/plaintextViewerSSR";
import { getFullReturnTo } from "../../../../utils/next/ssr";
import { withPageAuthRequiredSSR } from "../../../../utils/next/withPageAuthRequiredSSR";

/**
 * The one file a viewer addresses, beneath the project in the URL. The project, the path, and the
 * viewer come from that URL alone, so this page can never deliver a file of a project other than
 * the one it is addressed beneath.
 *
 * Every viewer is answered on the same terms: the server-rendered one is given the file's bytes,
 * and the viewers that fetch their own — in the browser, or through the parser — are told whether
 * the file is there and readable before they are framed. A file this caller may not read therefore
 * answers exactly as one the project does not hold, whichever viewer asked for it.
 */
export const getServerSideProps: GetServerSideProps<ProjectFileViewerProps> = async (ctx) => {
  const returnTo = getFullReturnTo(ctx);
  return withPageAuthRequiredSSR<ProjectFileViewerProps>({
    returnTo,
    getServerSideProps: async ({ req, res, query }) => {
      const address = readProjectFileAddress(query.projectId, query.path);
      if (address === null) {
        // The route contract answers this URL in Files itself; the response still states that the
        // file it named is not there.
        return {
          props: {
            delivery: resolveFileViewerDelivery(res, { statusCode: 404, statusMessage: "" }),
          },
        };
      }

      const { file, projectId } = address;
      const viewer =
        typeof query.viewer === "string" && isFileViewer(query.viewer)
          ? query.viewer
          : defaultFileViewer;
      const url =
        process.env.DATA_MANAGER_API_SERVER + projectFileResourcePath(projectId, file.path);

      const content =
        viewer === "text"
          ? (
              await plaintextViewerSSR(req, res, {
                compressed: isCompressedFileName(file.name),
                url,
              })
            ).props
          : await probeViewerResource(req, res, { url });

      return { props: { delivery: resolveFileViewerDelivery(res, content) } };
    },
  })(ctx);
};

export default withPagePolicy(pagePolicies.projects("files"), ProjectFileViewer);
