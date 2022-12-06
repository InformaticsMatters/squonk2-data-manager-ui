import { useMemo } from "react";

import type { ProductDmProjectTier } from "@squonk/account-server-client";

import { Link } from "@mui/material";
import { createColumnHelper } from "@tanstack/react-table";
import NextLink from "next/link";

import { DataTable } from "../../../components/DataTable";
import { ChargesLinkIconButton } from "../../../components/products/ChargesLinkIconButton";
import { DeleteProductButton } from "../../../components/products/DeleteProductButton";
import { CreateProjectButton } from "../../../components/projects/CreateProjectButton";
import { formatTierString } from "../../../utils/app/products";
import { getSharedColumns } from "../columns";

export interface ProjectProductTableProps {
  products: ProductDmProjectTier[];
}

const columnHelper = createColumnHelper<ProductDmProjectTier>();

export const ProjectProductTable = ({ products }: ProjectProductTableProps) => {
  const columns = useMemo(
    () => [
      ...getSharedColumns<ProductDmProjectTier>(),
      columnHelper.accessor(
        (row) => (row.product.flavour ? formatTierString(row.product.flavour) : ""),
        { id: "flavour", header: "Flavour" },
      ),
      columnHelper.accessor("claim", {
        header: "Project",
        cell: ({ row }) => {
          const product = row.original;
          if (product.claim?.id) {
            return (
              <NextLink
                legacyBehavior
                passHref
                href={{ pathname: "/project", query: { project: product.claim.id } }}
              >
                <Link>{product.claim.name}</Link>
              </NextLink>
            );
          }
          return <CreateProjectButton product={product.product} unit={row.original.unit} />;
        },
      }),
      columnHelper.display({
        id: "actions",
        header: "Actions",
        enableGrouping: false,
        cell: ({ row }) => (
          <>
            <ChargesLinkIconButton productId={row.original.product.id} />
            <DeleteProductButton
              disabled={!!row.original.claim?.id}
              product={row.original.product}
              tooltip={
                row.original.claim?.id
                  ? "You must delete the project first"
                  : "Delete product permanently"
              }
            />
          </>
        ),
      }),
    ],
    [],
  );

  return <DataTable columns={columns} data={products} />;
};
