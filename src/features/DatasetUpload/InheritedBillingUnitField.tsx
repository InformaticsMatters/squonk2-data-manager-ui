import { Alert, TextField } from "@mui/material";

import { type InheritedBillingUnit } from "../../datasets/versionBilling";

export interface InheritedBillingUnitFieldProps {
  inherited: InheritedBillingUnit;
}

/**
 * The unit a new version will be billed to: the dataset's own, shown and never chosen.
 *
 * A version cannot be billed anywhere its dataset is not, so there is nothing here to select. Where
 * the unit could not be established the field stays empty beside the reason, rather than offering
 * an alternative nobody may pick.
 */
export const InheritedBillingUnitField = ({ inherited }: InheritedBillingUnitFieldProps) => (
  <>
    <TextField
      disabled
      fullWidth
      helperText="A new version is billed to the unit the dataset already belongs to."
      label="Billing unit"
      sx={{ mb: 2 }}
      value={inherited.kind === "resolved" ? inherited.label : ""}
    />
    {inherited.kind === "unresolved" && (
      <Alert severity="warning" sx={{ mb: 2 }}>
        {inherited.reason}
      </Alert>
    )}
  </>
);
