import { useCallback, useMemo } from "react";

import { useGetDatasets } from "@squonk/data-manager-client/dataset";

import { CircularProgress } from "@mui/material";
import type { Row } from "@tanstack/react-table";
import { createColumnHelper } from "@tanstack/react-table";
import dynamic from "next/dynamic";

import { Chips } from "../../components/Chips";
import { DataTable } from "../../components/DataTable/DataTable";
import { LabelChip } from "../../components/labels/LabelChip";
import { combineLabels } from "../../utils/app/labels";
import { getErrorMessage } from "../../utils/next/orvalError";
import { EditorFilter } from "./filters/EditorFilter";
import { FileTypeFilter } from "./filters/FileTypeFilter";
import { LabelsFilter } from "./filters/LabelsFilter";
import { OwnerFilter } from "./filters/OwnerFilter";
import type { DatasetDetailsProps } from "./DatasetDetails";
import { DatasetsBulkActions } from "./DatasetsBulkActions";
import { DatasetsFilterToolbar } from "./DatasetsFilterToolbar";
import type { TableDataset } from "./types";
import { useDatasetsFilter } from "./useDatasetsFilter";
import { useSelectedDatasets } from "./useSelectedDatasets";

const DatasetUpload = dynamic<Record<string, never>>(
  () => import("../DatasetUpload").then((mod) => mod.DatasetUpload),
  {
    loading: () => <CircularProgress size="1rem" />,
  },
);

const DatasetDetails = dynamic<DatasetDetailsProps>(
  () => import("./DatasetDetails").then((mod) => mod.DatasetDetails),
  {
    loading: () => <CircularProgress size="1rem" />,
  },
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
export const DatasetsTable = () => {
  const columns = useMemo(
    () => [
      columnHelper.accessor("fileName", {
        header: "File Name",
        cell: ({ row }) => (
          <DatasetDetails
            dataset={row.original.datasetSummary}
            datasetName={row.original.datasetSummary.versions[0].file_name}
            version={row.original.datasetVersion}
          />
        ),
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
      columnHelper.accessor((row) => row.subRows.length || "", {
        id: "versions",
        header: "Versions",
      }),
      columnHelper.accessor("numberOfProjects", {
        header: "Number of projects",
      }),
    ],
    [],
  );

  const { params, filter, setFilterItem } = useDatasetsFilter();
  const { data, error, isLoading } = useGetDatasets(params);

  // Transform all datasets to match the data-table props
  const datasets: TableDataset[] = useMemo(
    () =>
      data?.datasets.map((dataset) => {
        const fileName = dataset.versions[0].file_name; // TODO: should either use the newest version or wait for the API to change
        const numberOfProjects = new Set(
          dataset.versions.map((version) => version.projects.map((project) => project)).flat(),
        ).size;

        return {
          type: "row",
          ...dataset,
          fileName,
          numberOfProjects,
          datasetSummary: dataset,
          labels: combineLabels(dataset.versions),
          datasetVersion: dataset.versions[0],
          subRows: dataset.versions.map<TableDataset>((version) => ({
            type: "subRow",
            ...dataset,
            fileName: `Version: ${version.version}`,
            numberOfProjects: version.projects.length,
            labels: (version.labels || {}) as Record<string, string | string[]>,
            version: version.version,
            datasetSummary: dataset,
            datasetVersion: version,
            subRows: [],
            owner: version.owner,
          })),
        };
      }) || [],
    [data],
  );

  const { selectedDatasets, onSelection } = useSelectedDatasets(datasets);

  const { owner, editor, fileType, labels } = filter;
  const getRowId = useCallback((row: TableDataset) => `${row.dataset_id}#${row.version}`, []);

  return (
    <DataTable
      subRowsEnabled
      columns={columns}
      data={datasets}
      error={getErrorMessage(error)}
      getRowId={getRowId}
      initialSelection={[]}
      isLoading={isLoading}
      ToolbarActionChild={<DatasetsBulkActions selectedDatasets={selectedDatasets} />}
      toolbarContent={
        <>
          <DatasetUpload />
          <DatasetsFilterToolbar
            fullWidthFilters={
              <LabelsFilter
                labels={labels}
                setLabels={(labels) => setFilterItem("labels", labels)}
              />
            }
            shrinkableFilters={[
              <OwnerFilter
                key="owner"
                owner={owner}
                setOwner={(owner) => setFilterItem("owner", owner)}
              />,
              <EditorFilter
                editor={editor}
                key="editor"
                setEditor={(editor) => setFilterItem("editor", editor)}
              />,
              <FileTypeFilter
                fileType={fileType}
                key="fileType"
                setFileType={(fileType) => setFilterItem("fileType", fileType)}
              />,
            ]}
          />
        </>
      }
      onSelection={onSelection}
    />
  );
};
