import type { CellProps, Column } from "react-table";

import type { ProductsGetResponseProductsItem } from "@squonk/account-server-client";

import { Link } from "@mui/material";
import NextLink from "next/link";

import { toLocalTimeString } from "../../utils/app/datetime";

export const sharedProductColumns: Column<ProductsGetResponseProductsItem>[] = [
  { id: "name", Header: "Name", accessor: (row) => row.product.name },
  {
    id: "created",
    Header: "Created",
    accessor: (row) => toLocalTimeString(row.product.created, true, true),
  },
  {
    id: "organisation",
    Header: "Organisation",
    accessor: (row) => row.organisation.name,
  },
  {
    id: "unit",
    Header: "Unit",
    accessor: (row) => row.unit.name,
  },
  {
    id: "id",
    Header: "Invoice",
    accessor: (row) => row.product.id,
    Cell: ({ row }: CellProps<ProductsGetResponseProductsItem>) => (
      <NextLink
        passHref
        href={{
          pathname: "/product/[productId]/invoice",
          query: { productId: row.original.product.id },
        }}
      >
        <Link>Invoice</Link>
      </NextLink>
    ),
  },
];
