/**
 * Generic search implementation
 * @param args possible strings to match against
 * @param value value of search box to find
 * @returns whether there is at least one hit
 */
export function search(args: (string | undefined | string[])[], value: string): boolean {
  return args.some((arg) => {
    if (typeof arg === "string") {
      return arg.toLowerCase().includes(value.toLowerCase());
    }
    return arg?.some((subArg) => subArg.toLowerCase().includes(value.toLowerCase()));
  });
}
