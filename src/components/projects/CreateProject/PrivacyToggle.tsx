import {
  ProductDetailFlavour,
  UnitAllDetailDefaultProductPrivacy,
} from "@squonk/account-server-client";

import { Checkbox, FormControlLabel } from "@mui/material";

export interface PrivacyToggleProps {
  /**
   * Selected flavour of the product
   */
  flavour: string;
  /**
   * Default privacy of the product given by the unit
   */
  defaultPrivacy: UnitAllDetailDefaultProductPrivacy;
  /**
   * Field object from Tanstack Form
   */
  field: { state: { value: boolean }; handleChange: (value: boolean) => void };
}

export const PrivacyToggle = ({ flavour, defaultPrivacy, field }: PrivacyToggleProps) => {
  // Disable the switch if the product is an evaluation product or if the default privacy is set to
  // always private or always public
  const isDisabled =
    flavour === ProductDetailFlavour.EVALUATION ||
    defaultPrivacy === UnitAllDetailDefaultProductPrivacy.ALWAYS_PRIVATE ||
    defaultPrivacy === UnitAllDetailDefaultProductPrivacy.ALWAYS_PUBLIC;

  return (
    <FormControlLabel
      control={
        <Checkbox
          checked={field.state.value}
          color="primary"
          disabled={isDisabled}
          onChange={(e) => field.handleChange(e.target.checked)}
        />
      }
      disabled={isDisabled}
      label="Private"
      labelPlacement="start"
    />
  );
};
