import type { FilePathFile, FilesGetResponse } from "@squonk/data-manager-client";
import { useGetFiles } from "@squonk/data-manager-client/file";

import { withPageAuthRequired } from "@auth0/nextjs-auth0/dist/frontend";
import Error from "next/error";
import Head from "next/head";
import { useRouter } from "next/router";

import { PlaintextViewer } from "../../components/PlaintextViewer";
import { API_ROUTES } from "../../constants/routes";
import { useProjectBreadcrumbs } from "../../hooks/projectPathHooks";
import { useApi } from "../../hooks/useApi";
import { getDecompressionType } from "../../utils/fileUtils";
import { getErrorMessage } from "../../utils/orvalError";
import { getQueryParams } from "../../utils/requestUtils";

type SelectDatasetVersionResult = {
  file?: FilePathFile;
  isSelectError: boolean;
  selectError?: string;
};

const selectProjectVersion = (
  files?: FilesGetResponse,
  fileName?: string,
): SelectDatasetVersionResult => {
  if (!files) {
    return { isSelectError: false };
  }

  const file = files.files.find((file) => file.file_name === fileName);

  if (!file) {
    return {
      isSelectError: true,
      selectError: "No file found for the specified file ID",
    };
  }
  return { file, isSelectError: false };
};

// 100 kB
const FILE_LIMIT_SIZE = 100_000;

/**
 * Displays plaintext viewer for a provided project file. The page is statically compiled, though
 * the content is populated in client. Firstly it parses information from provided `params`, then
 * fetches information about the project and finds the requested file. Finally it fetches a
 * limited amount of the file's content, which is then displayed. The helper function (the one
 * responsible selecting the file) is written in a declarative way. While the whole functionality
 * can be written imperatively using the `useEffect` hook, this should allows us easier potential
 * refactoring in the future.
 */
const FilePlainTextViewer = () => {
  const {
    query: { project, file: fileName },
  } = useRouter();

  const breadcrumbs = useProjectBreadcrumbs();
  const dirPath = "/" + breadcrumbs.join("/");

  const {
    data: files,
    isLoading: isFilesLoading,
    isError: isFilesError,
    error: filesError,
  } = useGetFiles({
    project_id: project as string,
    path: dirPath,
  });

  const { file, isSelectError, selectError } = selectProjectVersion(files, fileName as string);

  const decompress = file && getDecompressionType(file.file_name);
  const fileSizeLimit = FILE_LIMIT_SIZE;

  const {
    data: fileContents,
    isLoading: isContentsLoading,
    isError: isContentsError,
    error: contentsError,
  } = useApi<string>(
    `/project/${project}/file${getQueryParams({
      decompress,
      fileSizeLimit,
      path: dirPath,
      file: fileName,
    })}`,
    {
      transformResponse: (res) => {
        // Do your own parsing here if needed ie JSON.parse(res);
        return res;
      },
    },
    { enabled: !!file, refetchOnWindowFocus: false },
  );

  const isLoading = isFilesLoading || isContentsLoading;
  const isError = isFilesError || isSelectError || isContentsError;
  const error = getErrorMessage(filesError) || selectError || getErrorMessage(contentsError);

  if (typeof project !== "string" || typeof fileName !== "string") {
    return (
      <Error
        message="`project` and/or `file` query parameters are not specified correctly."
        statusCode={400}
      />
    );
  }

  const downloadUrl = API_ROUTES.projectFile(project, dirPath, fileName);

  return (
    <>
      <Head>
        <title>File Plaintext Viewer</title>
      </Head>
      <PlaintextViewer
        content={fileContents}
        decompress={decompress}
        downloadUrl={downloadUrl}
        error={error}
        fileSizeLimit={fileSizeLimit}
        isError={isError}
        isLoading={isLoading}
        title={file?.file_name ?? ""}
      />
    </>
  );
};

export default withPageAuthRequired(FilePlainTextViewer);
