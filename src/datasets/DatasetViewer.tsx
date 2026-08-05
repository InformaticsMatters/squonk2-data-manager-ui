import { ArrowBack } from "@mui/icons-material";
import { Button, Container } from "@mui/material";
import NextError from "next/error";
import A from "next/link";

import { useFamilyRoute } from "../application/FamilyRouteBoundary";
import { PlaintextViewer } from "../features/PlaintextViewer";
import Layout from "../layouts/Layout";
import { DatasetLoadError, DatasetResolutionBoundary } from "./DatasetResolutionBoundary";
import { datasetLinks, datasetListState, type DatasetRoute } from "./routes";
import { useDatasetVersionResolution } from "./useDatasetVersionResolution";
import { classifyDatasetVersionContent, type DatasetVersionContent } from "./viewerContent";

export type DatasetViewerProps = DatasetVersionContent;

export const DatasetViewer = (props: DatasetViewerProps) => {
  const familyRoute = useFamilyRoute();
  const route = familyRoute.localNotFound ? null : familyRoute.route;

  if (route?.kind !== "viewer") {
    return <NextError statusCode={404} />;
  }
  return (
    <Layout>
      <Container maxWidth="xl">
        <ResolvedDatasetViewer content={props} route={route} />
      </Container>
    </Layout>
  );
};

const ResolvedDatasetViewer = ({
  content,
  route,
}: {
  content: DatasetVersionContent;
  route: Extract<DatasetRoute, { kind: "viewer" }>;
}) => {
  const { datasetId, datasetVersion } = route;
  const { error, isLoading, refetch, resolution } = useDatasetVersionResolution(
    datasetId,
    datasetVersion,
  );

  return (
    <DatasetResolutionBoundary
      error={error}
      errorMessage="Dataset data could not be loaded. Retry this exact version."
      isLoading={isLoading}
      resolution={resolution}
      onRetry={() => void refetch()}
    >
      {({ version }) => (
        <>
          {/* An explicit return leaves the viewer rather than stacking it in history, exactly as
              closing the route-driven dataset detail does. */}
          <Button
            replace
            component={A}
            href={datasetLinks.version(datasetId, datasetVersion, datasetListState(route))}
            startIcon={<ArrowBack />}
            sx={{ marginTop: 2 }}
          >
            Back to dataset version
          </Button>
          <DatasetVersionContentView content={content} title={version.file_name} />
        </>
      )}
    </DatasetResolutionBoundary>
  );
};

const DatasetVersionContentView = ({
  content,
  title,
}: {
  content: DatasetVersionContent;
  title: string;
}) => {
  const outcome = classifyDatasetVersionContent(content);
  switch (outcome.kind) {
    case "content":
      return <PlaintextViewer {...outcome.content} compressed title={title} />;
    case "missing":
      return <NextError statusCode={404} title="Dataset version not found" />;
    case "recoverable":
      return (
        <DatasetLoadError
          message="Dataset content could not be loaded. Retry this exact version."
          sx={{ marginTop: 2 }}
          onRetry={() => globalThis.location.reload()}
        />
      );
    case "failed":
      return <NextError statusCode={outcome.statusCode} statusMessage={outcome.statusMessage} />;
  }
};
