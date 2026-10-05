import { Suspense, useEffect } from "react";

import { getGetUnitsSuspenseQueryOptions } from "@/api/account-server/unit";
import { getGetVersionsSuspenseQueryOptions } from "@/api/data-manager/dataset";
import { getGetProjectsSuspenseQueryOptions } from "@/api/data-manager/project";
import { getGetFileTypesSuspenseQueryOptions } from "@/api/data-manager/type";
import { getGetUsersSuspenseQueryOptions } from "@/api/data-manager/user";

import { Container, Skeleton, Typography } from "@mui/material";
import NextError from "next/error";
import { useRouter } from "next/router";

import { useFamilyRoute } from "../application/FamilyRouteResolution";
import { ModalWrapper } from "../components/modals/ModalWrapper";
import { Loading } from "../components/skeletons";
import { DatasetsTable } from "../features/DatasetsTable";
import { DatasetDetails } from "../features/DatasetsTable/DatasetDetails";
import { useSettledQueries, useSettledQuery } from "../hooks/useSettledQuery";
import { DatasetResolutionBoundary } from "./DatasetResolutionBoundary";
import { DatasetsListingSkeleton } from "./DatasetsSkeleton";
import { type DatasetDeletionDestination } from "./mutations";
import { datasetLinks, datasetListState, type DatasetRoute } from "./routes";
import { datasetInventoryReads } from "./useDatasetVersionBilling";
import { useDatasetVersionResolution } from "./useDatasetVersionResolution";

type DetailRoute = Exclude<DatasetRoute, { kind: "index" }>;

/** The details dialog before its reads have answered, shaped like the sections it will hold. */
const DatasetDetailsSkeleton = ({ onClose }: { onClose: () => void }) => (
  <ModalWrapper
    open
    DialogProps={{ fullScreen: true }}
    id="dataset-details-loading"
    title="Dataset"
    onClose={onClose}
  >
    <Container maxWidth="md">
      <Loading>
        {Array.from({ length: 5 }, (_, index) => (
          <Typography component="div" key={index} sx={{ mb: 3 }} variant="h5">
            <Skeleton width={180} />
            <Skeleton height={56} variant="rounded" />
          </Typography>
        ))}
      </Loading>
    </Container>
  </ModalWrapper>
);

/**
 * Every read the details make, started together beside the dataset's own, so the dialog opens once
 * with all of it rather than filling in section by section. The sections still read these with
 * their own hooks, and find them answered.
 */
const useDatasetDetailsReads = (datasetId: string) => {
  const unitsRead = getGetUnitsSuspenseQueryOptions();
  useSettledQueries([
    getGetVersionsSuspenseQueryOptions(datasetId),
    unitsRead,
    getGetProjectsSuspenseQueryOptions(),
    getGetFileTypesSuspenseQueryOptions(),
    getGetUsersSuspenseQueryOptions(),
  ]);
  // The inventory is asked once per scope the unit index names, so it can only start once that has
  // answered.
  useSettledQueries(datasetInventoryReads(useSettledQuery(unitsRead).data?.units ?? []));
};

const DatasetDetail = ({ route }: { route: DetailRoute }) => {
  const router = useRouter();
  useDatasetDetailsReads(route.datasetId);
  const requestedVersion = route.kind === "dataset" ? undefined : route.datasetVersion;
  const { error, isFetching, refetch, resolution } = useDatasetVersionResolution(
    route.datasetId,
    requestedVersion,
  );
  const state = datasetListState(route);
  const canonicalHref =
    route.kind === "dataset" && resolution.kind === "resolved"
      ? datasetLinks.version(route.datasetId, resolution.version.version, state)
      : undefined;

  useEffect(() => {
    if (canonicalHref) {
      void router.replace(canonicalHref as never);
    }
  }, [canonicalHref, router]);

  return (
    <DatasetResolutionBoundary
      error={error}
      errorMessage="Dataset data could not be loaded. Retry this dataset without changing the requested version."
      errorSx={{ position: "fixed", inset: 16, zIndex: (theme) => theme.zIndex.modal + 1 }}
      resolution={resolution}
      onRetry={() => void refetch()}
    >
      {({ dataset, version }) => (
        <DatasetDetails
          dataset={dataset}
          datasetName={version.file_name}
          freshness={isFetching ? "stale" : "current"}
          version={version}
          onClose={() => void router.replace(datasetLinks.index(state) as never)}
          onVersionChange={(nextVersion) =>
            void router.push(
              datasetLinks.version(dataset.dataset_id, nextVersion.version, state) as never,
            )
          }
          onVersionDeleted={(next: DatasetDeletionDestination) => {
            const href =
              next.status === "version"
                ? datasetLinks.version(dataset.dataset_id, next.version, state)
                : datasetLinks.index(state);
            void router.replace(href as never);
          }}
        />
      )}
    </DatasetResolutionBoundary>
  );
};

export const DatasetsWorkspace = () => {
  const router = useRouter();
  const familyRoute = useFamilyRoute();
  const route = familyRoute.localNotFound ? null : familyRoute.route;
  if (!route || !("kind" in route) || !["index", "dataset", "version"].includes(route.kind)) {
    return <NextError statusCode={404} />;
  }
  const datasetRoute = route as DatasetRoute;

  return (
    <>
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Typography gutterBottom component="h1" variant="h3">
          Datasets
        </Typography>
        <Suspense fallback={<DatasetsListingSkeleton />}>
          <DatasetsTable route={datasetRoute} />
        </Suspense>
      </Container>
      {datasetRoute.kind === "index" ? null : (
        <Suspense
          fallback={
            <DatasetDetailsSkeleton
              onClose={() =>
                void router.replace(datasetLinks.index(datasetListState(datasetRoute)) as never)
              }
            />
          }
        >
          <DatasetDetail route={datasetRoute} />
        </Suspense>
      )}
    </>
  );
};
