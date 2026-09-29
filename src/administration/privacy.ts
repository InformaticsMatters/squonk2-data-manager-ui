import {
  type OrganisationAllDetailDefaultProductPrivacy,
  UnitAllDetailDefaultProductPrivacy,
} from "@/api/account-server";

import { capitalise, shoutSnakeToLowerCase } from "../utils/app/language";

/**
 * Organisations and units declare the same generated privacy values, so one type answers for both
 * ends of the ancestry. Taking it from both generated unions means a unit value the organisation
 * does not declare stops compiling below. The opposite divergence narrows the intersection
 * silently, so the privacy contract asserts that the two generated unions still agree.
 */
export type ProductPrivacy = OrganisationAllDetailDefaultProductPrivacy &
  UnitAllDetailDefaultProductPrivacy;

/** The generated values themselves, so no screen or test writes its own list of them. */
export const productPrivacyValues: ProductPrivacy[] = Object.values(
  UnitAllDetailDefaultProductPrivacy,
);

export const productPrivacyLabel = (privacy: ProductPrivacy): string =>
  capitalise(shoutSnakeToLowerCase(privacy));

/** `ALWAYS_*` is a requirement the declaring resource imposes; `DEFAULT_*` is a starting value. */
export const productPrivacyIsEnforced = (privacy: ProductPrivacy): boolean =>
  privacy === "ALWAYS_PRIVATE" || privacy === "ALWAYS_PUBLIC";

export const productPrivacyIsPrivate = (privacy: ProductPrivacy): boolean =>
  privacy === "ALWAYS_PRIVATE" || privacy === "DEFAULT_PRIVATE";

/**
 * What an organisation that requires a privacy means for a unit being changed under it. Privacy
 * wording has one owner, so a capability and an explanation never drift apart about the same rule.
 */
export const enforcedProductPrivacyConstraint = (organisation: ProductPrivacy): string =>
  `The organisation requires ${productPrivacyLabel(organisation)}, so a value that conflicts with it is rejected.`;

/**
 * What an organisation's own default does, stated as the generated resource states it: a new value
 * applies to new units, and the default an existing unit already declares is honoured.
 */
export const declaredProductPrivacyExplanation = (organisation: ProductPrivacy): string => {
  const label = productPrivacyLabel(organisation);
  return productPrivacyIsEnforced(organisation)
    ? `Units created from now on start from ${label}, which this organisation requires. Existing units keep the default they already declare.`
    : `Units created from now on start from ${label}. Existing units keep the default they already declare.`;
};

/**
 * What the unit inherits from its organisation. The organisation seeds new units and constrains
 * what an existing unit may be changed to; it never replaces the default this unit already
 * declares. Which values conflict is the server's to decide, so nothing here predicts one.
 */
export const inheritedProductPrivacyExplanation = (organisation?: ProductPrivacy): string => {
  if (organisation === undefined) {
    return "This unit's organisation is not readable, so its declared default is unknown.";
  }
  const label = productPrivacyLabel(organisation);
  return productPrivacyIsEnforced(organisation)
    ? `The organisation requires ${label}. This unit's own default governs its projects, and a change that conflicts with the organisation is rejected.`
    : `The organisation's declared default is ${label}. It starts off new units; this unit's own default governs its projects.`;
};

/** What new projects in the unit take, which is the unit's own default and nothing else. */
export const effectiveProductPrivacyExplanation = (unit: ProductPrivacy): string => {
  const visibility = productPrivacyIsPrivate(unit) ? "private" : "public";
  return productPrivacyIsEnforced(unit)
    ? `New projects in this unit are always ${visibility}, because this unit's default is ${productPrivacyLabel(unit)}.`
    : `New projects in this unit start ${visibility}, and their creator may choose otherwise.`;
};
