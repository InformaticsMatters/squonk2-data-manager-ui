import { useState } from "react";

import type { UnitDetail } from "@squonk/account-server-client";
import { useGetUnit, useGetUnitCharges } from "@squonk/account-server-client/unit";

import { Box, Container, Paper, Typography } from "@mui/material";

import { SelectBillingCycle } from "./SelectBillingCycle";

export interface UnitChargesProps {
  unitId: UnitDetail["id"];
}

export const UnitCharges = ({ unitId }: UnitChargesProps) => {
  const [monthDelta, setMonthDelta] = useState(0);

  const { data: unit } = useGetUnit(unitId);
  const { data: charges } = useGetUnitCharges(unitId, { pbp: monthDelta });

  console.log(charges?.products.map((p) => p.charges));

  return (
    <Container maxWidth="md">
      <Typography variant="h1">Product Ledger</Typography>
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

      {unit?.billing_day && unit.created && (
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
        <Box padding={2}>
          <Typography variant="h4">Storage Charges</Typography>
          <Typography variant="subtitle1">
            Charges for stored data, e.g. Data Manager Datasets and project volumes
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};
