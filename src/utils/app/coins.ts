// TODO: write a custom formatter for Squonk coins
const coinsFormatter = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
});

const COINS_SYMBOL = "C";

export const formatCoins = (value: number | string) => {
  if (typeof value === "string") {
    value = Number.parseFloat(value);
  }

  // Add the coins symbol along with a non-breaking space "\xa0" in JS == &nbsp; in HTML
  return `${COINS_SYMBOL}\u00A0` + coinsFormatter.format(value).slice(1);
};
