import { useMemo } from "react";
import type { Column } from "react-table";

import type { ProductDmProjectTier } from "@squonk/account-server-client";

import { Button } from "@mui/material";
import NextLink from "next/link";

import { DataTable } from "../../../components/DataTable";
import { CreateProjectButton } from "../../../components/projects/CreateProjectButton";
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
        accessor: (row) => row.product.flavour?.toLocaleLowerCase(),
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
                <Button color="info">{product.claim.name}</Button>
              </NextLink>
            );
          }
          return <CreateProjectButton product={product.product} unit={row.original.unit} />;
        },
      },
    ],
    [],
  );

  return <DataTable columns={columns} data={products} />;
};
