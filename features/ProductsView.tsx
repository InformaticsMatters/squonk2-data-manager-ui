import type { ProductDmProjectTier, ProductDmStorage } from "@squonk/account-server-client";
import { useGetProducts } from "@squonk/account-server-client/product";

import { Alert, Box, Divider, Typography } from "@mui/material";
import groupBy from "just-group-by";

import { CenterLoader } from "../components/CenterLoader";
import { getErrorMessage } from "../utils/next/orvalError";
import { DatasetProductTable } from "./ProductTables/DatasetProductTable/DatasetProductTable";
import { ProjectProductTable } from "./ProductTables/ProjectProductTable/ProjectProductTable";

export const ProductsView = () => {
  const { data, isLoading, error } = useGetProducts();
  const products = data?.products;

  if (!data && isLoading) {
    return <CenterLoader />;
  }

  if (error) {
    return <Alert severity="error">{getErrorMessage(error)}</Alert>;
  }

  const groupedProducts = groupBy(products ?? [], (product) => product.product.type);
  const projectProducts = groupedProducts[
    "DATA_MANAGER_PROJECT_TIER_SUBSCRIPTION"
  ] as ProductDmProjectTier[];
  const datasetProducts = groupedProducts[
    "DATA_MANAGER_STORAGE_SUBSCRIPTION"
  ] as ProductDmStorage[];

  return (
    <>
      <Typography gutterBottom variant="h1">
        Products
      </Typography>
      <Typography gutterBottom variant="h2">
        Projects
      </Typography>
      <ProjectProductTable products={projectProducts} />

      <Box marginY={2}>
        <Divider />
      </Box>

      <Typography gutterBottom variant="h2">
        Datasets
      </Typography>
      <DatasetProductTable products={datasetProducts} />
    </>
  );
};
