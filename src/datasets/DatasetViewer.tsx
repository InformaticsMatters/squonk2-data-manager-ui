import { Container } from "@mui/material";
import NextError from "next/error";

import { useFamilyRoute } from "../application/FamilyRouteBoundary";
import { PlaintextViewer } from "../features/PlaintextViewer";
import { type NotSuccessful, type Successful } from "../utils/api/plaintextViewerSSR";
import { DatasetLoadError, DatasetResolutionBoundary } from "./DatasetResolutionBoundary";
import { useDatasetVersionResolution } from "./useDatasetVersionResolution";

export type DatasetViewerProps = NotSuccessful | Successful;

export const DatasetViewer = (props: DatasetViewerProps) => {
  const familyRoute = useFamilyRoute();
  const route = familyRoute.localNotFound ? null : familyRoute.route;

  if (route?.kind !== "viewer") {
    return <NextError statusCode={404} />;
  }
  return (
    <ResolvedDatasetViewer {...props} datasetId={route.datasetId} version={route.datasetVersion} />
  );
};

const ResolvedDatasetViewer = ({
  datasetId,
  version,
  ...props
}: DatasetViewerProps & { datasetId: string; version: number }) => {
  const { error, isLoading, refetch, resolution } = useDatasetVersionResolution(datasetId, version);

  return (
    <DatasetResolutionBoundary
      error={error}
      errorMessage="Dataset data could not be loaded. Retry this exact version."
      isLoading={isLoading}
      resolution={resolution}
      onRetry={() => void refetch()}
    >
      {({ version: resolvedVersion }) => {
        if (!("content" in props)) {
          return props.statusCode === 429 || props.statusCode >= 500 ? (
            <DatasetLoadError
              message="Dataset content could not be loaded. Retry this exact version."
              onRetry={() => globalThis.location.reload()}
            />
          ) : (
            <NextError statusCode={props.statusCode} statusMessage={props.statusMessage} />
          );
        }
        return (
          <Container maxWidth="xl">
            <PlaintextViewer {...props} compressed title={resolvedVersion.file_name} />
          </Container>
        );
      }}
    </DatasetResolutionBoundary>
  );
};
