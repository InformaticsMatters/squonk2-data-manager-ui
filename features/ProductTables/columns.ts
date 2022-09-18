import type { Column } from "react-table";

import type { ProductsGetResponseProductsItem } from "@squonk/account-server-client";

import { toLocalTimeString } from "../../components/LocalTime";

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
];
