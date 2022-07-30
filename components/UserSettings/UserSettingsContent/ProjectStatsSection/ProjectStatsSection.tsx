import { useMemo } from "react";
import type { Cell, Column } from "react-table";

import type { ProductDmProjectTier, ProductDmStorage } from "@squonk/account-server-client";

import { Box, useTheme } from "@mui/material";

import { useCurrentProjectId } from "../../../../hooks/projectHooks";
import { getErrorMessage } from "../../../../utils/orvalError";
import { formatTierString } from "../../../../utils/productUtils";
import { DataTable } from "../../../DataTable";
import { ProjectActions } from "./ProjectActions";
import { ProjectSelectionRadio } from "./ProjectSelectionRadio";
import { ProjectUsageChart } from "./ProjectUsageChart";
import { StorageUsageChart } from "./StorageUsageChart";
import type { ProductDmProjectTierAndOwner } from "./useProjectSubscriptions";
import { useProjectSubscriptions } from "./useProjectSubscriptions";
import { useStorageSubscriptions } from "./useStorageSubscriptions";

/**
 * Displays `Project stats` section in User Settings.
 */
export const ProjectStatsSection = () => {
  const theme = useTheme();
  const { projectId: currentProjectId } = useCurrentProjectId();

  const {
    projectSubscriptions,
    isLoading: isProjectSubscriptionsLoading,
    isError: isProjectSubscriptionsError,
  } = useProjectSubscriptions();

  const {
    storageSubscriptions,
    isLoading: isStorageSubscriptionsLoading,
    isError: isStorageSubscriptionsError,
    error: storageSubscriptionsError,
  } = useStorageSubscriptions();

  const projectsColumns: Column<ProductDmProjectTierAndOwner>[] = useMemo(
    () => [
      {
        id: "projectSelection",
        defaultCanSort: false,
        Cell: ({ row }: Cell<ProductDmProjectTier>) => {
          return <ProjectSelectionRadio projectProduct={row.original} />;
        },
      },
      {
        id: "projectName",
        accessor: (row) => row.claim?.name,
        Header: "Project name",
      },
      {
        id: "owner",
        accessor: (row) => row.owner,
        Header: "Owner",
      },
      {
        id: "tier",
        accessor: (row) => formatTierString(row.product.flavour ?? ""),
        Header: "Tier",
      },
      {
        id: "usage",
        Header: "Usage",
        defaultCanSort: false,
        Cell: ({ row }: Cell<ProductDmProjectTier>) => {
          return <ProjectUsageChart projectSubscription={row.original} />;
        },
      },
      {
        id: "instancesUsed",
        accessor: (row) => row.instance.coins.used,
        Header: "Instances used",
      },
      {
        id: "storageUsed",
        accessor: (row) => row.storage.coins.used,
        Header: "Storage used",
      },
      {
        id: "allowance",
        accessor: (row) => row.coins.allowance,
        Header: "Allowance",
      },
      {
        id: "actions",
        Header: "Actions",
        Cell: ({ row }: Cell<ProductDmProjectTier>) => {
          return <ProjectActions projectProduct={row.original} />;
        },
      },
    ],
    [],
  );

  const storageColumns: Column<ProductDmStorage>[] = useMemo(
    () => [
      {
        id: "for-layout-only-1",
        disableSortBy: true,
      },
      {
        id: "storageName",
        Header: "", // We don't want a header for this column
        accessor: (row) => row.product.name,
        disableSortBy: true,
      },
      {
        id: "for-layout-only-2",
        disableSortBy: true,
      },
      {
        id: "usage",
        Header: "Usage",
        defaultCanSort: false,
        Cell: ({ row }: Cell<ProductDmStorage>) => {
          return <StorageUsageChart storageSubscription={row.original} />;
        },
        disableSortBy: true,
      },
      {
        id: "for-layout-only-3",
        disableSortBy: true,
      },
      {
        id: "used",
        accessor: (row) => row.storage.coins.used,
        Header: "Used",
        disableSortBy: true,
      },
      {
        id: "allowance",
        accessor: (row) => row.coins.allowance,
        Header: "Allowance",
        disableSortBy: true,
      },
      {
        id: "for-layout-only-4",
        disableSortBy: true,
      },
    ],
    [],
  );

  return (
    <Box display="grid" sx={{ overflowX: "auto" }}>
      <DataTable
        columns={projectsColumns}
        customRowProps={(row) =>
          row.original.claim?.id === currentProjectId
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
              gridTemplateColumns: "61px 1fr 1fr 110px 220px 100px 100px 100px 100px",
            },
          },
        }}
        data={projectSubscriptions}
        enableSearch={false}
        isError={isProjectSubscriptionsError}
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
        isError={isStorageSubscriptionsError}
        isLoading={isStorageSubscriptionsLoading}
        tableContainer={false}
      />
    </Box>
  );
};
