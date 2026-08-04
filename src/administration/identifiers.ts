import {
  isOrganisationId,
  isProductId,
  isUnitId,
  type OrganisationId,
  type ProductId,
  type UnitId,
} from "../routing/identifiers";

/**
 * Account Server responses are the only source of Administration resource identity. These
 * assertions refuse to build a link from an identity the route contract would reject.
 */
export const assertOrganisationId = (value: string): OrganisationId => {
  if (!isOrganisationId(value)) {
    throw new Error("Account Server returned an invalid organisation ID");
  }
  return value;
};

export const assertUnitId = (value: string): UnitId => {
  if (!isUnitId(value)) {
    throw new Error("Account Server returned an invalid unit ID");
  }
  return value;
};

export const assertProductId = (value: string): ProductId => {
  if (!isProductId(value)) {
    throw new Error("Account Server returned an invalid product ID");
  }
  return value;
};
