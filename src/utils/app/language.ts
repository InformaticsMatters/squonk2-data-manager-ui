export const capitalise = (text: string) => text.replace(/\b\w/gu, (l) => l.toLocaleUpperCase());

export const shoutSnakeToLowerCase = (text: string) =>
  text.split("_").join(" ").toLocaleLowerCase();
