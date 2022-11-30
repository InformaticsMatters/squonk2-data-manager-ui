import { useMemo } from "react";

import type { ProductDmStorage } from "@squonk/account-server-client";

import { createColumnHelper } from "@tanstack/react-table";

import { DataTable } from "../../../components/DataTable";
import { AdjustProjectProduct } from "../../../components/products/AdjustProjectProduct";
import { ChargesLinkIconButton } from "../../../components/products/ChargesLinkIconButton";
import { DeleteProductButton } from "../../../components/products/DeleteProductButton";
import { getSharedColumns } from "../columns";

export interface DatasetProductTableProps {
  products: ProductDmStorage[];
}

const columnHelper = createColumnHelper<ProductDmStorage>();

export const DatasetProductTable = ({ products }: DatasetProductTableProps) => {
  const columns = useMemo(
    () => [
      ...getSharedColumns<ProductDmStorage>(),
      columnHelper.accessor((row) => row.storage.size.current, { id: "size", header: "Size" }),
      columnHelper.accessor((row) => row.storage.coins.used, { id: "coins", header: "Coins" }),
      columnHelper.display({
        id: "actions",
        header: "Actions",
        enableGrouping: false,
        cell: ({ row }) => (
          <>
            <ChargesLinkIconButton productId={row.original.product.id} />
            <AdjustProjectProduct
              allowance={row.original.coins.allowance}
              product={row.original.product}
            />
            <DeleteProductButton
              product={row.original.product}
              tooltip="Delete product permanently"
            />
          </>
        ),
      }),
    ],
    [],
  );

  return <DataTable columns={columns} data={products} />;
};
