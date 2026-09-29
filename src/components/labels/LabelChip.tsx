import { Cancel as CancelIcon } from "@mui/icons-material";
import { Chip, type ChipProps } from "@mui/material";

import { labelFormatter } from "../../utils/app/labels";

export interface LabelChipProps extends ChipProps {
  /**
   * The key of the label. Displayed on the left-hand side of the `=`.
   */
  label: string;
  /**
   * Determines the text displayed on the right-hand side of the `=`.
   * See the docs for './utils/labelUtils'
   */
  values: string[] | string;
}

/**
 * Wrapped MuiChip component that takes a label and values prop and formats these in the label
 * format
 */
export const LabelChip = ({ label, values, ...ChipProps }: LabelChipProps) => {
  const formattedLabel = labelFormatter(label, values);
  return (
    <Chip
      {...ChipProps}
      deleteIcon={<CancelIcon aria-label={`Remove ${formattedLabel}`} />}
      label={formattedLabel}
      size="small"
      variant="outlined"
    />
  );
};
