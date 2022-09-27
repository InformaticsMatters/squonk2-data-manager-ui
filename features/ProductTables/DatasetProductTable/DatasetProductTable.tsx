import { useCallback, useMemo } from "react";
import type { CellProps, Column, PluginHook } from "react-table";

import type { ProductDmStorage } from "@squonk/account-server-client";

import { DataTable } from "../../../components/DataTable";
import { AdjustProjectProduct } from "../../../components/products/AdjustProjectProduct";
import { DeleteProductButton } from "../../../components/products/DeleteProductButton";
import { sharedProductColumns } from "../columns";

export interface DatasetProductTableProps {
  products: ProductDmStorage[];
}

export const DatasetProductTable = ({ products }: DatasetProductTableProps) => {
  const columns: Column<ProductDmStorage>[] = useMemo(
    () => [
      ...(sharedProductColumns as Column<ProductDmStorage>[]),
      { id: "size", Header: "Size", accessor: (row) => row.storage.size.current },
      { id: "coins", Header: "Coins", accessor: (row) => row.storage.coins.used },
    ],
    [],
  );

  // react-table plugin to add actions buttons for project files
  const useActionsColumnPlugin: PluginHook<ProductDmStorage> = useCallback((hooks) => {
    hooks.visibleColumns.push((columns) => {
      return [
        ...columns,
        {
          id: "actions",
          groupByBoundary: true, // Ensure normal columns can't be ordered before this
          Header: "Actions",
          Cell: ({ row }: CellProps<ProductDmStorage, any>) => (
            <>
              <DeleteProductButton
                product={row.original.product}
                tooltip="Delete product permanently"
              />
              <AdjustProjectProduct
                allowance={row.original.coins.allowance}
                product={row.original.product}
              />
            </>
          ),
        },
      ];
    });
  }, []);

  return (
    <DataTable columns={columns} data={products} useActionsColumnPlugin={useActionsColumnPlugin} />
  );
};
