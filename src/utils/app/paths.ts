export const pathFromQuery = (query: string[] | string | undefined = ""): string => {
  if (query.length === 0) {
    return "/";
  } else if (typeof query === "string") {
    return "/" + query;
  }
  return "/" + query.join("/");
};
