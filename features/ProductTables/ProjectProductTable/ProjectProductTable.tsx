import { useCallback, useMemo } from "react";
import type { CellProps, Column, PluginHook } from "react-table";

import type { ProductDmProjectTier } from "@squonk/account-server-client";

import { Link } from "@mui/material";
import NextLink from "next/link";

import { DataTable } from "../../../components/DataTable";
import { DeleteProductButton } from "../../../components/products/DeleteProductButton";
import { CreateProjectButton } from "../../../components/projects/CreateProjectButton";
import { formatTierString } from "../../../utils/app/products";
import { sharedProductColumns } from "../columns";

export interface ProjectProductTableProps {
  products: ProductDmProjectTier[];
}

export const ProjectProductTable = ({ products }: ProjectProductTableProps) => {
  const columns: Column<ProductDmProjectTier>[] = useMemo(
    () => [
      ...(sharedProductColumns as Column<ProductDmProjectTier>[]),
      {
        id: "flavour",
        Header: "Flavour",
        accessor: (row) => (row.product.flavour ? formatTierString(row.product.flavour) : ""),
      },
      {
        accessor: "claim",
        Header: "Project",
        Cell: ({ row }) => {
          const product = row.original;
          if (product.claim?.id) {
            return (
              <NextLink
                passHref
                href={{ pathname: "/project", query: { project: product.claim.id } }}
              >
                <Link>{product.claim.name}</Link>
              </NextLink>
            );
          }
          return <CreateProjectButton product={product.product} unit={row.original.unit} />;
        },
      },
    ],
    [],
  );

  // react-table plugin to add actions buttons for project files
  const useActionsColumnPlugin: PluginHook<ProductDmProjectTier> = useCallback((hooks) => {
    hooks.visibleColumns.push((columns) => {
      return [
        ...columns,
        {
          id: "actions",
          groupByBoundary: true, // Ensure normal columns can't be ordered before this
          Header: "Actions",
          Cell: ({ row }: CellProps<ProductDmProjectTier, any>) => (
            <DeleteProductButton
              disabled={!!row.original.claim?.id}
              product={row.original.product}
              tooltip={
                row.original.claim?.id
                  ? "You must delete the project first"
                  : "Delete product permanently"
              }
            />
          ),
        },
      ];
    });
  }, []);

  return (
    <DataTable columns={columns} data={products} useActionsColumnPlugin={useActionsColumnPlugin} />
  );
};
