import { type getProducts } from "@/api/account-server/product";

import { createColumnHelper } from "@tanstack/react-table";

import { toLocalTimeString } from "../../utils/app/datetime";

type Product = Awaited<ReturnType<typeof getProducts>>["products"][number];

export const getSharedColumns = <T extends Product>() => {
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
