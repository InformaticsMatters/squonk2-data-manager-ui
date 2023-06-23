import type { ProductDmProjectTier, ProductDmStorage } from "@squonk/account-server-client";
import { useGetProducts } from "@squonk/account-server-client/product";

import { Alert, Box, Divider, Grid, Typography } from "@mui/material";
import groupBy from "just-group-by";

import { CenterLoader } from "../components/CenterLoader";
import { CreateDatasetStorageSubscription } from "../components/CreateDatasetStorageSubscription";
import { SelectOrganisation } from "../components/userContext/SelectOrganisation";
import { SelectUnit } from "../components/userContext/SelectUnit";
import { useASAuthorizationStatus } from "../hooks/useIsAuthorized";
import { useSelectedOrganisation } from "../state/organisationSelection";
import { useSelectedUnit } from "../state/unitSelection";
import { getErrorMessage } from "../utils/next/orvalError";
import { DatasetProductTable } from "./ProductTables/DatasetProductTable/DatasetProductTable";
import { ProjectProductTable } from "./ProductTables/ProjectProductTable/ProjectProductTable";

export const ProductsView = () => {
  const { data, isLoading, error } = useGetProducts();
  const products = data?.products;

  const [unit] = useSelectedUnit();
  const [organisation] = useSelectedOrganisation();

  const accountServerAuthorization = useASAuthorizationStatus();
  const userIsNotEvaluating =
    accountServerAuthorization !== process.env.NEXT_PUBLIC_KEYCLOAK_AS_EVALUATOR_ROLE;

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
      <Grid container gap={2} marginY={2}>
        <Grid item sm={3} xs={12}>
          <SelectOrganisation />
        </Grid>
        <Grid item sm={3} xs={12}>
          {organisation && <SelectUnit userFilter={["none"]} />}
        </Grid>
        <Grid item sm={5} xs={12}>
          {unit && userIsNotEvaluating && <CreateDatasetStorageSubscription unit={unit} />}
        </Grid>
      </Grid>
      <DatasetProductTable products={datasetProducts} />
    </>
  );
};
