import { type ProductsGetResponseProductsItem } from "@squonk/account-server-client";

import { createColumnHelper } from "@tanstack/react-table";

import { toLocalTimeString } from "../../utils/app/datetime";

export const getSharedColumns = <T extends ProductsGetResponseProductsItem>() => {
  const columnHelper = createColumnHelper<T>();

  return [
    columnHelper.accessor((row) => row.product.name, { header: "Name", id: "name" }),
    columnHelper.accessor((row) => toLocalTimeString(row.product.created, true, true), {
      header: "Created",
      id: "created",
    }),
    columnHelper.accessor((row) => row.organisation.name, {
      header: "Organisation",
      id: "organisation",
    }),
    columnHelper.accessor((row) => row.unit.name, { header: "Unit", id: "unit" }),
  ];
};
