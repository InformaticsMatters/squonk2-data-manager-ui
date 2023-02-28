import { useMemo } from "react";

import type { ProductDmProjectTier, ProductDmStorage } from "@squonk/account-server-client";
import type { ProjectDetail } from "@squonk/data-manager-client";

import { Box, useTheme } from "@mui/material";
import { createColumnHelper } from "@tanstack/react-table";

import { DataTable } from "../../components/DataTable";
import { ChargesLinkIconButton } from "../../components/products/ChargesLinkIconButton";
import { useCurrentProjectId } from "../../hooks/projectHooks";
import { formatTierString } from "../../utils/app/products";
import { getErrorMessage } from "../../utils/next/orvalError";
import { ProjectActions } from "./ProjectActions";
import { ProjectSelectionRadio } from "./ProjectSelectionRadio";
import { ProjectUsageChart } from "./ProjectUsageChart";
import { StorageUsageChart } from "./StorageUsageChart";
import { useProjectSubscriptions } from "./useProjectSubscriptions";
import { useStorageSubscriptions } from "./useStorageSubscriptions";

const projectColumnHelper = createColumnHelper<Partial<ProductDmProjectTier> & ProjectDetail>();
const datasetStorageColumnHelper = createColumnHelper<ProductDmStorage>();

/**
 * Displays `Project stats` section in User Settings.
 */
export const ProjectStatsSection = () => {
  const theme = useTheme();
  const { projectId: currentProjectId } = useCurrentProjectId();

  const { projectSubscriptions, isLoading: isProjectSubscriptionsLoading } =
    useProjectSubscriptions();

  const {
    storageSubscriptions,
    isLoading: isStorageSubscriptionsLoading,
    error: storageSubscriptionsError,
  } = useStorageSubscriptions();

  const projectsColumns = useMemo(
    () => [
      projectColumnHelper.display({
        id: "projectSelection",
        enableSorting: false,
        cell: ({ row }) => <ProjectSelectionRadio projectId={row.original.project_id} />,
      }),
      projectColumnHelper.accessor((row) => row.name, {
        id: "projectName",
        header: "Project name",
      }),
      projectColumnHelper.accessor("owner", { header: "Owner" }),
      projectColumnHelper.accessor((row) => formatTierString(row.product?.flavour ?? ""), {
        id: "tier",
        header: "Tier",
      }),
      projectColumnHelper.display({
        id: "usage",
        header: "Usage",
        enableSorting: false,
        cell: ({ row }) =>
          row.original.coins &&
          row.original.instance &&
          row.original.storage && (
            <ProjectUsageChart
              coins={row.original.coins}
              instance={row.original.instance}
              storage={row.original.storage}
            />
          ),
      }),
      projectColumnHelper.accessor((row) => row.instance?.coins.used, {
        header: "Instances used",
        id: "instancesUsed",
      }),
      projectColumnHelper.accessor((row) => row.storage?.coins.used, {
        header: "Storage used",
        id: "storageUsed",
      }),
      projectColumnHelper.accessor((row) => row.coins?.allowance, {
        header: "Allowance",
        id: "allowance",
      }),
      projectColumnHelper.display({
        id: "actions",
        header: "Actions",
        cell: ({ row }) =>
          row.original.product && <ProjectActions productId={row.original.product.id} />,
      }),
    ],
    [],
  );

  const storageColumns = useMemo(
    () => [
      datasetStorageColumnHelper.display({ id: "for-layout-only-1", enableSorting: false }),
      datasetStorageColumnHelper.accessor((row) => row.product.name, {
        id: "storageName",
        header: "",
        enableSorting: false,
      }),
      datasetStorageColumnHelper.display({ id: "for-layout-only-2", enableSorting: false }),
      datasetStorageColumnHelper.display({
        id: "usage",
        header: "Usage",
        enableSorting: false,
        cell: ({ row }) => <StorageUsageChart storageSubscription={row.original} />,
      }),
      datasetStorageColumnHelper.display({ id: "for-layout-only-3", enableSorting: false }),
      datasetStorageColumnHelper.accessor((row) => row.storage.coins.used, {
        id: "used",
        header: "Used",
        enableSorting: false,
      }),
      datasetStorageColumnHelper.accessor((row) => row.coins.allowance, {
        id: "allowance",
        header: "Allowance",
        enableSorting: false,
      }),
      datasetStorageColumnHelper.display({
        id: "actions",
        header: "Actions",
        cell: ({ row }) => <ChargesLinkIconButton productId={row.original.product.id} />,
      }),
    ],
    [],
  );

  return (
    <Box display="grid" sx={{ overflowX: "auto" }}>
      <DataTable
        columns={projectsColumns}
        customRowProps={(row) =>
          currentProjectId !== undefined && row.original.project_id === currentProjectId
            ? { style: { backgroundColor: theme.palette.action.hover } }
            : {}
        }
        customTableProps={{
          sx: {
            "& td": {
              wordBreak: "break-word",
            },
            "& tr": {
              display: "grid",
              gridTemplateColumns: "61px 1fr 1fr 110px 220px 100px 100px 100px 110px",
            },
          },
        }}
        data={projectSubscriptions}
        enableSearch={false}
        getRowId={(row) => row.project_id}
        isLoading={isProjectSubscriptionsLoading}
        tableContainer={false}
      />
      <DataTable
        columns={storageColumns}
        customTableProps={{
          sx: {
            "& td": {
              wordBreak: "break-word",
            },
            "& tr": {
              display: "grid",
              gridTemplateColumns: "61px 1fr 110px 220px 100px 100px 100px 100px",
            },
          },
        }}
        data={storageSubscriptions}
        enableSearch={false}
        error={getErrorMessage(storageSubscriptionsError)}
        isLoading={!storageSubscriptions && isStorageSubscriptionsLoading}
        tableContainer={false}
      />
    </Box>
  );
};
