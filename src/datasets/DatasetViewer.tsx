import { Alert, Button, Container } from "@mui/material";
import NextError from "next/error";

import { useFamilyRoute } from "../application/FamilyRouteBoundary";
import { CenterLoader } from "../components/CenterLoader";
import { PlaintextViewer } from "../features/PlaintextViewer";
import { type NotSuccessful, type Successful } from "../utils/api/plaintextViewerSSR";
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
  if (error) {
    return (
      <Alert
        action={
          <Button color="inherit" size="small" onClick={() => void refetch()}>
            Retry
          </Button>
        }
        severity="error"
      >
        Dataset data could not be loaded. Retry this exact version.
      </Alert>
    );
  }
  if (isLoading) {
    return <CenterLoader />;
  }
  if (!resolution || resolution.kind === "dataset-not-found") {
    return <NextError statusCode={404} title="Dataset not found" />;
  }
  if (resolution.kind === "version-not-found") {
    return <NextError statusCode={404} title="Dataset version not found" />;
  }
  if (!("content" in props)) {
    return <NextError statusCode={props.statusCode} statusMessage={props.statusMessage} />;
  }

  return (
    <Container maxWidth="xl">
      <PlaintextViewer {...props} compressed title={resolution.version.file_name} />
    </Container>
  );
};
