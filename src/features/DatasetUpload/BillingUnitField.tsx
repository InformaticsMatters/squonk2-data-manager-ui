import { MenuItem, TextField, Typography } from "@mui/material";

import {
  type BillingUnit,
  type BillingUnitChoice,
  billingUnitLabel,
} from "../../datasets/uploadBilling";

export interface BillingUnitFieldProps {
  choice: BillingUnitChoice;
  /**
   * Locked once the batch has sent its first file, because every file in a batch is billed to the
   * unit that batch started with.
   */
  committed: boolean;
  eligible: readonly BillingUnit[];
  onChoose: (unitId: string) => void;
}

/**
 * The batch's billing context. It opens empty unless a still-eligible unit is remembered from the
 * caller's last successful upload, so an upload is never billed to a unit nobody named.
 */
export const BillingUnitField = ({
  choice,
  committed,
  eligible,
  onChoose,
}: BillingUnitFieldProps) => (
  <>
    <TextField
      fullWidth
      required
      select
      disabled={committed}
      helperText={
        committed
          ? "Every file in this batch is billed to the unit it started with."
          : "Datasets are billed to the unit you choose here."
      }
      label="Billing unit"
      sx={{ mb: 2 }}
      value={choice.kind === "none" ? "" : choice.unitId}
      onChange={(event) => onChoose(event.target.value)}
    >
      {eligible.map((billingUnit) => (
        <MenuItem key={billingUnit.unit.id} value={billingUnit.unit.id}>
          {billingUnitLabel(billingUnit)}
        </MenuItem>
      ))}
    </TextField>
    {choice.kind === "remembered" && (
      <Typography color="text.secondary" sx={{ mb: 2 }} variant="body2">
        Using the billing unit of your last successful upload. Change it if this batch belongs
        elsewhere.
      </Typography>
    )}
  </>
);
