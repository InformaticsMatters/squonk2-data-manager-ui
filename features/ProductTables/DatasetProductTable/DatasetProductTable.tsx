import { useMemo } from "react";
import type { Column } from "react-table";

import type { ProductDmStorage } from "@squonk/account-server-client";

import { DataTable } from "../../../components/DataTable";
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

  return <DataTable columns={columns} data={products} />;
};
