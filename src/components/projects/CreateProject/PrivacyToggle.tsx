import {
  ProductDetailFlavour,
  UnitAllDetailDefaultProductPrivacy,
} from "@squonk/account-server-client";

import { FormControlLabel } from "@mui/material";
import { Field } from "formik";
import { Checkbox } from "formik-mui";

export interface PrivacySwitchProps {
  /**
   * Selected flavour of the product
   */
  flavour: string;
  /**
   * Default privacy of the product given by the unit
   */
  defaultPrivacy: UnitAllDetailDefaultProductPrivacy;
}

export const PrivacyToggle = ({ flavour, defaultPrivacy }: PrivacySwitchProps) => {
  // Disable the switch if the product is an evaluation product or if the default privacy is set to
  // always private or always public
  const isDisabled =
    flavour === ProductDetailFlavour.EVALUATION ||
    defaultPrivacy === UnitAllDetailDefaultProductPrivacy.ALWAYS_PRIVATE ||
    defaultPrivacy === UnitAllDetailDefaultProductPrivacy.ALWAYS_PUBLIC;

  return (
    <FormControlLabel
      control={<Field color="primary" component={Checkbox} name="isPrivate" type="checkbox" />}
      disabled={isDisabled}
      label="Private"
      labelPlacement="start"
    />
  );
};
