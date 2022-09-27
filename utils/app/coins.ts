// TODO: write a custom formatter for Squonk coins
export const coinsFormatter = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
});
