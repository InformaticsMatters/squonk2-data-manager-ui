import { useEffect } from "react";

import { Alert, Button, Container, Typography } from "@mui/material";
import NextError from "next/error";
import { useRouter } from "next/router";

import { useFamilyRoute } from "../application/FamilyRouteBoundary";
import { CenterLoader } from "../components/CenterLoader";
import { DatasetsTable } from "../features/DatasetsTable";
import { DatasetDetails } from "../features/DatasetsTable/DatasetDetails";
import Layout from "../layouts/Layout";
import { datasetLinks, datasetListState, type DatasetRoute } from "./routes";
import { useDatasetVersionResolution } from "./useDatasetVersionResolution";

const DatasetDetail = ({ route }: { route: Exclude<DatasetRoute, { kind: "index" }> }) => {
  const router = useRouter();
  const requestedVersion = route.kind === "dataset" ? undefined : route.datasetVersion;
  const { error, isLoading, refetch, resolution } = useDatasetVersionResolution(
    route.datasetId,
    requestedVersion,
  );
  const state = datasetListState(route);
  const canonicalHref =
    route.kind === "dataset" && resolution?.kind === "resolved"
      ? datasetLinks.version(route.datasetId, resolution.version.version, state)
      : undefined;

  useEffect(() => {
    if (canonicalHref) {
      void router.replace(canonicalHref as never);
    }
  }, [canonicalHref, router]);

  if (error) {
    return (
      <Alert
        action={
          <Button color="inherit" size="small" onClick={() => void refetch()}>
            Retry
          </Button>
        }
        severity="error"
        sx={{ position: "fixed", inset: 16, zIndex: (theme) => theme.zIndex.modal + 1 }}
      >
        Dataset data could not be loaded. Retry this dataset without changing the requested version.
      </Alert>
    );
  }
  if (isLoading || canonicalHref) {
    return <CenterLoader />;
  }
  if (!resolution || resolution.kind === "dataset-not-found") {
    return <NextError statusCode={404} title="Dataset not found" />;
  }
  if (resolution.kind === "version-not-found") {
    return <NextError statusCode={404} title="Dataset version not found" />;
  }

  const { dataset, version } = resolution;
  return (
    <DatasetDetails
      dataset={dataset}
      datasetName={version.file_name}
      version={version}
      onClose={() => void router.replace(datasetLinks.index(state) as never)}
      onVersionChange={(nextVersion) =>
        void router.push(
          datasetLinks.version(dataset.dataset_id, nextVersion.version, state) as never,
        )
      }
    />
  );
};

export const DatasetsWorkspace = () => {
  const familyRoute = useFamilyRoute();
  const route = familyRoute.localNotFound ? null : familyRoute.route;
  if (!route || !("kind" in route) || !["index", "dataset", "version"].includes(route.kind)) {
    return <NextError statusCode={404} />;
  }
  const datasetRoute = route as DatasetRoute;

  return (
    <Layout>
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Typography gutterBottom component="h1" variant="h3">
          Datasets
        </Typography>
        <DatasetsTable route={datasetRoute} />
      </Container>
      {datasetRoute.kind === "index" ? null : <DatasetDetail route={datasetRoute} />}
    </Layout>
  );
};
