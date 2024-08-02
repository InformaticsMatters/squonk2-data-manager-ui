import { useState } from "react";

import { type UnitAllDetail, type UnitProductChargeSummary } from "@squonk/account-server-client";
import { useGetUnit, useGetUnitCharges } from "@squonk/account-server-client/unit";

import {
  Box,
  Container,
  Divider,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";

import { formatCoins } from "../../utils/app/coins";
import { ChargesLinkIconButton } from "../products/ChargesLinkIconButton";
import { SelectBillingCycle } from "./SelectBillingCycle";

export interface UnitChargesProps {
  unitId: UnitAllDetail["id"];
}

const productTypes: Record<UnitProductChargeSummary["product_type"], string> = {
  DATA_MANAGER_PROJECT_TIER_SUBSCRIPTION: "Project Subscription",
  DATA_MANAGER_STORAGE_SUBSCRIPTION: "Dataset Subscription",
};

export const UnitCharges = ({ unitId }: UnitChargesProps) => {
  const [monthDelta, setMonthDelta] = useState(0);

  const { data: unit } = useGetUnit(unitId);
  const { data: charges } = useGetUnitCharges(unitId, { pbp: monthDelta });

  const processingTotal = charges?.summary.charges.find(
    (charge) => charge.type === "PROCESSING",
  )?.coins;
  const storageTotal = charges?.summary.charges.find((charge) => charge.type === "STORAGE")?.coins;
  const totalCharges = charges?.summary.charges
    .map((charge) => charge.coins)
    .reduce((acc, charge) => acc + Number.parseFloat(charge), 0);

  return (
    <Container maxWidth="md">
      <Typography variant="h1">Unit Ledger</Typography>
      <Typography variant="subtitle2">{unit?.id}</Typography>
      <Typography gutterBottom component="p" variant="h5">
        Charges against: {unit?.name}
      </Typography>
      <Typography gutterBottom>
        <strong>Billed to</strong>: unit <em>{unit?.name}</em>
      </Typography>
      <Typography gutterBottom component="h2" variant="h4">
        Billing period
      </Typography>

      {!!unit?.billing_day && !!unit.created && (
        <SelectBillingCycle
          billingDay={unit.billing_day}
          created={unit.created}
          monthDelta={monthDelta}
          onChange={setMonthDelta}
        />
      )}

      <Typography gutterBottom sx={{ mt: 2 }} variant="h2">
        Charges
      </Typography>
      <Paper>
        <Table size="small" sx={{ marginBottom: 2 }}>
          <TableHead>
            <TableRow>
              <TableCell />
              <TableCell>Product Type</TableCell>
              <TableCell>Storage Charges</TableCell>
              <TableCell>Processing Charges</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {charges?.products.map((product, index) => (
              <TableRow key={product.product_id}>
                <TableCell>{index + 1}</TableCell>
                <TableCell>{productTypes[product.product_type]}</TableCell>
                <TableCell>
                  {formatCoins(
                    product.charges.find((charge) => charge.type === "STORAGE")?.coins ?? 0,
                  )}
                </TableCell>
                <TableCell>
                  {formatCoins(
                    product.charges.find((charge) => charge.type === "PROCESSING")?.coins ?? 0,
                  )}
                </TableCell>
                <TableCell>
                  <ChargesLinkIconButton productId={product.product_id} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>

      <Divider sx={{ my: 2 }} />
      <Box textAlign="right">
        <Typography variant="h4">Subtotal Total</Typography>
        Processing: {!!processingTotal && formatCoins(processingTotal)}
        <br />
        Storage: {!!storageTotal && formatCoins(storageTotal)}
        <Typography variant="h3">Total Charges</Typography>
        <Typography variant="subtitle1">To be paid by the unit owner</Typography>
        Total: {!!totalCharges && formatCoins(totalCharges)}
      </Box>
    </Container>
  );
};
