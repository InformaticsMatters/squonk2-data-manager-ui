/**
 * Formats the tier string, e.g. GOLD -> Gold.
 */
export const formatTierString = (original: string) => {
  return original.charAt(0).toUpperCase() + original.slice(1).toLowerCase();
};

/**
 * Gets the billing day for a product in the range of 1-28
 */
export const getBillingDay = () => {
  const today = new Date().getDate();
  return Math.min(28, today - 1);
};
