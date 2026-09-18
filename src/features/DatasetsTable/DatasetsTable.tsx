import { useCallback, useMemo } from "react";

import { useGetDatasets } from "@/api/data-manager/dataset";

import { Alert, Button, CircularProgress } from "@mui/material";
import { createColumnHelper, type Row } from "@tanstack/react-table";
import dynamic from "next/dynamic";
import { useRouter } from "next/router";

import { Chips } from "../../components/Chips";
import { DataTable } from "../../components/DataTable/DataTable";
import { LabelChip } from "../../components/labels/LabelChip";
import { NextLink } from "../../components/NextLink";
import { getDatasetListParams } from "../../datasets/datasetQuery";
import { resolveDatasetVersion } from "../../datasets/resolveDatasetVersion";
import {
  datasetLinks,
  type DatasetListState,
  datasetListState,
  type DatasetRoute,
  datasetRouteHref,
} from "../../datasets/routes";
import { combineLabels } from "../../utils/app/labels";
import { EditorFilter } from "./filters/EditorFilter";
import { FileTypeFilter } from "./filters/FileTypeFilter";
import { LabelsFilter } from "./filters/LabelsFilter";
import { OwnerFilter } from "./filters/OwnerFilter";
import { DatasetsBulkActions } from "./DatasetsBulkActions";
import { DatasetsFilterToolbar } from "./DatasetsFilterToolbar";
import { type TableDataset } from "./types";
import { useSelectedDatasets } from "./useSelectedDatasets";

const DatasetUpload = dynamic<Record<string, never>>(
  () => import("../DatasetUpload").then((mod) => mod.DatasetUpload),
  { loading: () => <CircularProgress size="1rem" /> },
);

const editorsSorter = (rowA: Row<TableDataset>, rowB: Row<TableDataset>) => {
  if (rowA.original.editors.join(" ") > rowB.original.editors.join(" ")) {
    return 1;
  }
  return -1;
};

const columnHelper = createColumnHelper<TableDataset>();

/**
 * MuiTable managed by react-table that displays datasets viewable by the user with option to see
 * further details of a dataset.
 */
export const DatasetsTable = ({ route }: { route: DatasetRoute }) => {
  const router = useRouter();
  const state = datasetListState(route);
  const updateState = (change: Partial<DatasetListState>) => {
    const nextState = { ...state, ...change };
    void router.replace(datasetRouteHref(route, nextState) as never, undefined, { shallow: true });
  };
  const columns = useMemo(
    () => [
      columnHelper.accessor("fileName", {
        header: "File Name",
        cell: ({ row }) => {
          const { datasetVersion } = row.original;
          return datasetVersion ? (
            <NextLink
              component="a"
              href={
                datasetLinks.version(
                  row.original.dataset_id,
                  datasetVersion.version,
                  state,
                ) as never
              }
            >
              {row.original.fileName}
            </NextLink>
          ) : (
            row.original.fileName
          );
        },
      }),
      columnHelper.accessor("labels", {
        header: "Labels",
        cell: ({ getValue }) => (
          <Chips>
            {Object.entries(getValue()).map(([label, values]) => (
              <LabelChip key={label} label={label} values={values} />
            ))}
          </Chips>
        ),
      }),
      columnHelper.accessor("editors", {
        header: "Editors",
        sortingFn: editorsSorter,
        cell: ({ getValue }) => getValue().join(", "),
      }),
      columnHelper.accessor((row) => row.subRows.length > 0 || "", {
        id: "versions",
        header: "Versions",
      }),
      columnHelper.accessor("numberOfProjects", { header: "Number of projects" }),
    ],
    [state],
  );

  const params = getDatasetListParams(state);
  const { data, error, isLoading, refetch } = useGetDatasets(params);

  // Transform all datasets to match the data-table props
  const datasets: TableDataset[] = useMemo(
    () =>
      data?.datasets.map((dataset) => {
        const resolution = resolveDatasetVersion([dataset], dataset.dataset_id);
        const currentVersion = resolution.kind === "resolved" ? resolution.version : undefined;
        const fileName = currentVersion?.file_name ?? "No available versions";
        const numberOfProjects = new Set(
          dataset.versions.flatMap((version) => version.projects.map((project) => project)),
        ).size;

        return {
          type: "row",
          ...dataset,
          fileName,
          numberOfProjects,
          datasetSummary: dataset,
          labels: dataset.versions.length > 0 ? combineLabels(dataset.versions) : {},
          ...(currentVersion ? { datasetVersion: currentVersion } : {}),
          subRows: dataset.versions.map<TableDataset>((version) => ({
            type: "subRow",
            ...dataset,
            fileName: `Version: ${version.version}`,
            numberOfProjects: version.projects.length,
            labels: (version.labels ?? {}) as Record<string, string[] | string>,
            version: version.version,
            datasetSummary: dataset,
            datasetVersion: version,
            subRows: [],
            owner: version.owner,
          })),
        };
      }) ?? [],
    [data],
  );

  const { selectedDatasets, onSelection } = useSelectedDatasets(datasets);

  const getRowId = useCallback((row: TableDataset) => `${row.dataset_id}#${row.version}`, []);

  return (
    <>
      {error && route.kind === "index" ? (
        <Alert
          action={
            <Button color="inherit" size="small" onClick={() => void refetch()}>
              Retry
            </Button>
          }
          severity="error"
          sx={{ mb: 2 }}
        >
          Dataset list could not be loaded. Retry without changing the current Datasets view.
        </Alert>
      ) : null}
      <DataTable
        subRowsEnabled
        columns={columns}
        data={datasets}
        getRowId={getRowId}
        initialSelection={[]}
        isLoading={isLoading}
        searchLabel="Search datasets"
        searchValue={state.search ?? ""}
        ToolbarActionChild={<DatasetsBulkActions selectedDatasets={selectedDatasets} />}
        toolbarContent={
          <>
            <DatasetUpload />
            <DatasetsFilterToolbar
              fullWidthFilters={
                <LabelsFilter
                  labels={state.labels ? [...state.labels] : undefined}
                  setLabels={(labels) => updateState({ labels })}
                />
              }
              shrinkableFilters={[
                <OwnerFilter
                  key="owner"
                  owner={state.owner ? { username: state.owner } : undefined}
                  setOwner={(owner) => updateState({ owner: owner?.username })}
                />,
                <EditorFilter
                  editor={state.editor ? { username: state.editor } : undefined}
                  key="editor"
                  setEditor={(editor) => updateState({ editor: editor?.username })}
                />,
                <FileTypeFilter
                  fileType={
                    state.mimeType ? { file_extensions: [], mime: state.mimeType } : undefined
                  }
                  key="fileType"
                  setFileType={(fileType) => updateState({ mimeType: fileType?.mime })}
                />,
              ]}
            />
          </>
        }
        onSearchChange={(search) => updateState({ search: search || undefined })}
        onSelection={onSelection}
      />
    </>
  );
};
