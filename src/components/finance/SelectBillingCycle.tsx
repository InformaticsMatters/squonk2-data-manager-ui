import { type Dispatch, type SetStateAction } from "react";

import { MenuItem, Select } from "@mui/material";

import { getBillingPeriods } from "../../utils/app/products";

export interface SelectBillingCycleProps {
  monthDelta: number;
  onChange: Dispatch<SetStateAction<number>>;
  billingDay: number;
  created: string;
}

export const SelectBillingCycle = ({
  billingDay,
  created,
  monthDelta,
  onChange,
}: SelectBillingCycleProps) => {
  const periods = getBillingPeriods(billingDay, created);

  return (
    <Select
      id="select-billing-cycle"
      size="small"
      value={monthDelta}
      onChange={(event) => {
        onChange(Number(event.target.value));
      }}
    >
      {periods.map(([i, d1, d2]) => (
        <MenuItem key={d1} value={i}>{`${d1} — ${d2}`}</MenuItem>
      ))}
    </Select>
  );
};
